import { Directus } from "@directus/sdk";

const getUserData = async (accessToken) => {
  const directus = new Directus(process.env.NEXT_PUBLIC_API_BASE_URL);
  return await directus.users.me.read({ access_token: accessToken });
};

export default getUserData;
