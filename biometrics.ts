
/**
 * BukoCash Biometric Service
 * Uses WebAuthn for platform authentication (TouchID/FaceID/Fingerprint)
 */

export const isBiometricsSupported = async (): Promise<boolean> => {
  try {
    // 1. Basic API Check
    if (!window.PublicKeyCredential || !window.isSecureContext) {
      return false;
    }

    // 2. Check for Platform Authenticator (TouchID, FaceID, etc.)
    const available = await window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
    
    // 3. Optional: Check if the feature is blocked by Permissions-Policy
    // We can't easily check the policy string, but we can assume that if the 
    // metadata.json is correctly configured, this will work.
    
    return available;
  } catch (e) {
    console.error("Error checking biometric support:", e);
    return false;
  }
};

export const registerBiometrics = async (userId: string): Promise<boolean> => {
  try {
    const challenge = new Uint8Array(32);
    window.crypto.getRandomValues(challenge);

    const publicKeyCredentialCreationOptions: any = {
      challenge,
      rp: { name: "BukoCash Finance", id: window.location.hostname },
      user: {
        id: Uint8Array.from(userId, c => c.charCodeAt(0)),
        name: userId,
        displayName: userId,
      },
      pubKeyCredParams: [{ alg: -7, type: "public-key" }], // ES256
      authenticatorSelection: {
        authenticatorAttachment: "platform", // Force TouchID/FaceID
        userVerification: "required",
        residentKey: "preferred",
        requireResidentKey: false,
      },
      timeout: 60000,
      attestation: "none",
    };

    const credential = await navigator.credentials.create({
      publicKey: publicKeyCredentialCreationOptions,
    });

    return !!credential;
  } catch (error: any) {
    if (error.name === 'NotAllowedError') {
      console.warn("User denied or Permissions Policy blocked WebAuthn:", error.message);
    } else if (error.name === 'SecurityError') {
      console.error("WebAuthn blocked by Permissions Policy. Ensure 'publickey-credentials-create' is allowed.");
    } else {
      console.error("Biometric registration failed:", error);
    }
    return false;
  }
};

export const authenticateBiometrics = async (): Promise<boolean> => {
  try {
    const challenge = new Uint8Array(32);
    window.crypto.getRandomValues(challenge);

    const publicKeyCredentialRequestOptions: any = {
      challenge,
      allowCredentials: [], // Allow any registered platform credential on this device
      userVerification: "required",
      timeout: 60000,
    };

    const assertion = await navigator.credentials.get({
      publicKey: publicKeyCredentialRequestOptions,
    });

    return !!assertion;
  } catch (error: any) {
    if (error.name === 'NotAllowedError') {
      console.warn("User cancelled or failed biometric check.");
    } else if (error.name === 'SecurityError') {
      console.error("WebAuthn blocked by Permissions Policy. Ensure 'publickey-credentials-get' is allowed.");
    } else {
      console.error("Biometric authentication failed:", error);
    }
    return false;
  }
};
