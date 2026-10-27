import { Amplify } from "aws-amplify";
import { env } from "./env";

/**
 * Points Amplify Auth at the Cognito user pool created by Terraform.
 * Call once, before rendering the app.
 */
export function configureAmplify(): void {
  Amplify.configure({
    Auth: {
      Cognito: {
        userPoolId: env.userPoolId,
        userPoolClientId: env.clientId,
        loginWith: { email: true },
        signUpVerificationMethod: "code",
      },
    },
  });
}
