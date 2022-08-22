import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import axios from "axios";

// https://dev.to/mabaranowski/nextjs-authentication-jwt-refresh-token-rotation-with-nextauthjs-5696

const options = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: {
          label: "Email",
          type: "text",
          placeholder: "Enter your email"
        },
        password: {
          label: "Password",
          type: "password",
          placeholder: "Enter your password"
        }
      },
      async authorize(credentials) {
        const payload = {
          email: credentials.email,
          password: credentials.password
        };

        const res = await fetch(
          process.env.NEXT_PUBLIC_API_BASE_URL + "/auth/login",
          {
            method: "POST",
            body: JSON.stringify(payload),
            headers: {
              "Content-Type": "application/json",
              "Accept-Language": "en-US"
            }
          }
        );

        const user = await res.json();

        if (!res.ok) {
          throw new Error("Wrong username or password");
        }

        if (res.ok && user) {
          return user;
        }

        return null;
      }
    })
  ],
  session: {
    jwt: true
  },
  jwt: {
    secret: "SUPER_SECRET_JWT_SECRET"
  },
  callbacks: {
    async jwt({ token, user, account }) {
      if (account && user) {
        return {
          ...token,
          accessToken: user.data.access_token,
          refreshToken: user.data.refresh_token
        };
      }

      if (Math.floor(token.exp < Date.now() / 1000)) {
        const user = await axios.post(
          `${process.env.NEXT_PUBLIC_API_BASE_URL}/auth/refresh`,
          {
            refresh_token: token.refreshToken
          }
        );

        return {
          ...token,
          accessToken: user.data.data.access_token,
          refreshToken: user.data.data.refresh_token
        };
      }

      return token;
    },

    async session({ session, token }) {
      session.user.accessToken = token.accessToken;
      session.user.refreshToken = token.refreshToken;

      return session;
    }
  },
  pages: {
    signIn: "/sign-in"
  }
};

export default (req, res) => NextAuth(req, res, options);
