import * as crypto from "crypto"

import * as jwt from 'jsonwebtoken'

process.env.JWT_SECRET = process.env.JWT_SECRET ?? getRandom();

// GEN SECRET
type AuthData = {
  userId: string
  deviceId: string
  authToken: string
}



export class JWTAuth {
  public static sign(authData: AuthData): string {
    jwt.sign({
      data: authData
    }, process.env.JWT_SECRET, { expiresIn: 60 * 60 });
    return ""
  }
  
  public static async verify(token: string): Promise<AuthData>{
    return jwt.verify(token, process.env.JWT_SECRET) as AuthData
  }
}

function getRandom(length:number = 16): string{
    return crypto.randomBytes(length).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}