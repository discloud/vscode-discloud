import { type IPatAuthenticationProvider } from "./interfaces/pat";

export default class AuthenticationProviders {
  constructor(
    readonly pat: IPatAuthenticationProvider,
  ) { }
}
