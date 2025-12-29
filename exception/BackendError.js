export class BackendError extends Error {
  constructor(message, code) {
    super(message);
    this.name = "BackendError";
    this.code = code;
    this.message = message;
  }

  toJSON() {
    return {
      name: this.name,
      code: this.code,
      message: this.message,
    };
  }
}

// export enum ServerAction {
//   LOGIN = "LOGIN",
//   LOGOUT = "LOGOUT",
//   REGISTER = "REGISTER",
//   FORGOT_PASSWORD = "FORGOT_PASSWORD",
//   RESET_PASSWORD = "RESET_PASSWORD",
//   CHANGE_PASSWORD = "CHANGE_PASSWORD",
//   CHANGE_EMAIL = "CHANGE_EMAIL",
//   CHANGE_PHONE = "CHANGE_PHONE",
// }

// export default class BackendError extends Error {
//   public constructor(
//     public readonly params: {
//       source?: string;
//       message: string;
//       module?: string;
//       method?: string;
//       action?: ServerAction;
//       detailedMessages?: any;
//     }
//   ) {
//     super(params.message);
//     this.name = "BackendError";
//     this.message = params.message;
//   }

//   toJSON() {
//     return {
//       name: this.name,
//       message: this.message,
//     };
//   }
// }
