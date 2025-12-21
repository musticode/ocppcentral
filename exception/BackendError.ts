import { User } from "../models/User";
import { UserToken } from "../models/UserToken";

export enum ServerAction {
  LOGIN = "LOGIN",
  LOGOUT = "LOGOUT",
  REGISTER = "REGISTER",
  FORGOT_PASSWORD = "FORGOT_PASSWORD",
  RESET_PASSWORD = "RESET_PASSWORD",
  CHANGE_PASSWORD = "CHANGE_PASSWORD",
  CHANGE_EMAIL = "CHANGE_EMAIL",
  CHANGE_PHONE = "CHANGE_PHONE",
}

export default class BackendError extends Error {
  public constructor(
    public readonly params: {
      source?: string;
      message: string;
      module?: string;
      method?: string;
      action?: ServerAction;
      user?: User | UserToken | string;
      actionOnUser?: User;
      detailedMessages?: any;
      chargingStationID?: string;
      siteID?: string;
      siteAreaID?: string;
      companyID?: string;
    }
  ) {
    super(params.message);
  }
}
