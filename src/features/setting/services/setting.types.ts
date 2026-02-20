export interface BlockedUser {
  id: number;
  username: string;
  fullName: string;
  profileImage: string;
}


export interface LogoutPayload {
  refreshToken?: string;
}