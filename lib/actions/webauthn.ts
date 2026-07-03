"use server"

import { redirect } from "next/navigation"
import { after } from "next/server"
import {
  generateRegistrationOptions,
  verifyRegistrationResponse,
  generateAuthenticationOptions,
  verifyAuthenticationResponse,
  type AuthenticatorTransportFuture,
  type RegistrationResponseJSON,
  type AuthenticationResponseJSON,
} from "@simplewebauthn/server"
import { db } from "@/lib/db"
import { getSession, setAuthCookie } from "@/lib/auth"
import { signToken } from "@/lib/jwt"
import { getWebAuthnConfig, storeChallenge, consumeChallenge } from "@/lib/webauthn"
import { logAuthEvent } from "@/lib/audit"

const MAX_PASSKEYS_PER_USER = 10
const MAX_PASSKEY_NAME_LENGTH = 64

export async function generatePasskeyRegistrationOptions() {
  const session = await getSession()
  if (!session) throw new Error("Not authenticated")

  const config = getWebAuthnConfig()
  const user = await db.user.findUnique({ where: { id: session.userId } })
  if (!user) throw new Error("User not found")

  const existing = await db.passkeyCredential.findMany({
    where: { userId: user.id },
    select: { id: true, transports: true },
  })

  if (existing.length >= MAX_PASSKEYS_PER_USER) {
    return {
      error: `You can register up to ${MAX_PASSKEYS_PER_USER} passkeys. Remove one before adding another.`,
    }
  }

  const options = await generateRegistrationOptions({
    rpName: config.rpName,
    rpID: config.rpID,
    userName: user.email,
    userDisplayName: user.name ?? user.email,
    userID: new TextEncoder().encode(user.id),
    excludeCredentials: existing.map((cred) => ({
      id: cred.id,
      transports: cred.transports as AuthenticatorTransportFuture[],
    })),
    authenticatorSelection: {
      // "required" ensures the credential is discoverable, which is
      // mandatory for the usernameless sign-in flow (no allowCredentials).
      residentKey: "required",
      // Passkeys are the sole auth factor here (not a 2FA step on top of a
      // password), so verification must be enforced, not merely hinted at.
      userVerification: "required",
    },
  })

  const { id: challengeId } = await storeChallenge(user.id, options.challenge)

  return { options, challengeId }
}

export async function verifyPasskeyRegistration(
  challengeId: string,
  response: RegistrationResponseJSON,
  deviceLabel?: string
) {
  const session = await getSession()
  if (!session) throw new Error("Not authenticated")

  if (typeof challengeId !== "string" || !challengeId || !response || typeof response !== "object") {
    return { error: "Invalid request." }
  }

  const name =
    typeof deviceLabel === "string" && deviceLabel.trim()
      ? deviceLabel.trim().slice(0, MAX_PASSKEY_NAME_LENGTH)
      : null

  const config = getWebAuthnConfig()
  const stored = await consumeChallenge(challengeId)
  if (!stored || stored.userId !== session.userId) {
    return { error: "Challenge expired or invalid. Please try again." }
  }

  let verification
  try {
    verification = await verifyRegistrationResponse({
      response,
      expectedChallenge: stored.challenge,
      expectedOrigin: config.origin,
      expectedRPID: config.rpID,
    })
  } catch (err) {
    console.error("Passkey registration verification error:", err)
    return { error: "Passkey verification failed. Please try again." }
  }

  if (!verification.verified || !verification.registrationInfo) {
    return { error: "Passkey verification failed. Please try again." }
  }

  const { credential, credentialDeviceType, credentialBackedUp } =
    verification.registrationInfo

  try {
    await db.passkeyCredential.create({
      data: {
        id: credential.id,
        userId: session.userId,
        publicKey: Buffer.from(credential.publicKey),
        transports: response.response?.transports ?? [],
        counter: credential.counter,
        backedUp: credentialBackedUp,
        deviceType: credentialDeviceType,
        name,
      },
    })
  } catch {
    return { error: "This passkey is already registered." }
  }

  after(() =>
    logAuthEvent({
      type: "PASSKEY_ADDED",
      userId: session.userId,
      metadata: { credentialId: credential.id, deviceType: credentialDeviceType },
    })
  )

  return { success: true }
}

export async function generatePasskeyAuthenticationOptions() {
  const config = getWebAuthnConfig()

  const options = await generateAuthenticationOptions({
    rpID: config.rpID,
    // Passkeys replace the password entirely here, so verification must be
    // required, not merely preferred — otherwise a stolen-but-unlocked
    // authenticator could sign in on possession alone.
    userVerification: "required",
  })

  const { id: challengeId } = await storeChallenge(null, options.challenge)

  return { options, challengeId }
}

export async function verifyPasskeyAuthentication(
  challengeId: string,
  response: AuthenticationResponseJSON
) {
  if (
    typeof challengeId !== "string" ||
    !challengeId ||
    !response ||
    typeof response !== "object" ||
    typeof response.id !== "string"
  ) {
    return { error: "Invalid request." }
  }

  const config = getWebAuthnConfig()
  const stored = await consumeChallenge(challengeId)
  if (!stored) {
    return { error: "Challenge expired. Please try again." }
  }

  const credential = await db.passkeyCredential.findUnique({
    where: { id: response.id },
  })
  if (!credential) {
    return { error: "Passkey not recognized. Please use a different method." }
  }

  let verification
  try {
    verification = await verifyAuthenticationResponse({
      response,
      expectedChallenge: stored.challenge,
      expectedOrigin: config.origin,
      expectedRPID: config.rpID,
      credential: {
        id: credential.id,
        publicKey: new Uint8Array(credential.publicKey),
        counter: credential.counter,
        transports: credential.transports as AuthenticatorTransportFuture[],
      },
    })
  } catch (err) {
    console.error("Passkey authentication verification error:", err)
    return { error: "Passkey verification failed. Please try again." }
  }

  if (!verification.verified) {
    return { error: "Passkey verification failed. Please try again." }
  }

  const user = await db.user.findUnique({ where: { id: credential.userId } })
  if (!user) {
    return { error: "User not found." }
  }

  await db.passkeyCredential.update({
    where: { id: credential.id },
    data: {
      counter: verification.authenticationInfo.newCounter,
      lastUsedAt: new Date(),
    },
  })

  const token = await signToken({
    userId: user.id,
    email: user.email,
    sessionVersion: user.sessionVersion,
  })
  await setAuthCookie(token)

  after(() =>
    logAuthEvent({ type: "LOGIN_SUCCESS", userId: user.id, email: user.email, metadata: { method: "passkey" } })
  )

  redirect("/dashboard")
}

export async function getPasskeyCredentials() {
  const session = await getSession()
  if (!session) return []

  const credentials = await db.passkeyCredential.findMany({
    where: { userId: session.userId },
    orderBy: { createdAt: "desc" },
  })

  return credentials.map((cred) => ({
    id: cred.id,
    name: cred.name,
    deviceType: cred.deviceType,
    backedUp: cred.backedUp,
    createdAt: cred.createdAt,
    lastUsedAt: cred.lastUsedAt,
  }))
}

export async function removePasskey(credentialId: string) {
  const session = await getSession()
  if (!session) throw new Error("Not authenticated")

  const credential = await db.passkeyCredential.findUnique({
    where: { id: credentialId },
  })
  if (!credential || credential.userId !== session.userId) {
    throw new Error("Passkey not found")
  }

  const user = await db.user.findUnique({
    where: { id: session.userId },
    select: { password: true, googleId: true },
  })
  if (!user) throw new Error("User not found")

  // If a passkey is the user's only sign-in method, deleting it would
  // permanently lock them out of the account.
  if (!user.password && !user.googleId) {
    const passkeyCount = await db.passkeyCredential.count({
      where: { userId: session.userId },
    })
    if (passkeyCount <= 1) {
      throw new Error(
        "Add a password or another sign-in method before removing your last passkey."
      )
    }
  }

  await db.passkeyCredential.delete({ where: { id: credentialId } })

  after(() => logAuthEvent({ type: "PASSKEY_REMOVED", userId: session.userId, metadata: { credentialId } }))
}

export async function renamePasskey(credentialId: string, name: string) {
  const session = await getSession()
  if (!session) throw new Error("Not authenticated")

  if (typeof name !== "string") {
    throw new Error("Invalid name")
  }

  const credential = await db.passkeyCredential.findUnique({
    where: { id: credentialId },
  })
  if (!credential || credential.userId !== session.userId) {
    throw new Error("Passkey not found")
  }

  const trimmed = name.trim().slice(0, MAX_PASSKEY_NAME_LENGTH)

  await db.passkeyCredential.update({
    where: { id: credentialId },
    data: { name: trimmed || null },
  })
}
