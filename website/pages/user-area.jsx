import { useSession } from "next-auth/react";
import { useRouter } from "next/router";
import { useState, useEffect } from "react";
import { Directus } from "@directus/sdk";
import Head from "next/head";
import getUserData from "../helpers/getUserData";
import { toast } from "../utils/toast";
import vcWebsite from "../lib/VCWebsite";

function UserArea() {
  const router = useRouter();
  const [userData, setUserData] = useState("");

  const { data: session, status } = useSession({
    required: true,
    onUnauthenticated() {
      router.push("/sign-in");
    }
  });

  useEffect(() => {
    async function initialFetch() {
      const user = await getUserData(session.user.accessToken);
      setUserData(user);
    }
    if (status === "authenticated") {
      initialFetch();
    }
  }, [status]); // When status changes to authenticated code will execute, going from loading... to authenticated

  const updateUserData = async (obj) => {
    const directus = new Directus(process.env.NEXT_PUBLIC_API_BASE_URL);
    try {
      const user = await directus.users.me.update(
        {
          id: userData.id,
          first_name: obj.first_name,
          last_name: obj.last_name,
          location: obj.location,
          title: obj.title,
          phone: obj.phone
        },
        { access_token: session.user.accessToken }
      );
      setUserData(user);
      toast("success", "Save Successful", "Personal information was saved");
    } catch (err) {
      toast("error", "Save Failed", "An error occurred, please try again");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const obj = {
      first_name: e.target.first_name.value,
      last_name: e.target.last_name.value,
      location: e.target.location.value,
      title: e.target.title.value,
      phone: e.target.phone.value
    };

    updateUserData(obj);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setUserData({ ...userData, [name]: value });
  };

  return (
    <div className="ml-5 mr-5">
      <Head>
        <title>User Area</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <div className="flex m-10 w-full max-w-md mx-auto overflow-hidden bg-white rounded-lg shadow-lg dark:bg-gray-800 lg:max-w-4xl">
        <div
          className="hidden bg-cover lg:block lg:w-1/2"
          style={{
            backgroundImage: "url('/images/walking-1060x1169.png')",
            boxShadow: "0 0 8px 8px #F3F4F6 inset"
          }}
        ></div>

        <div className="w-full px-6 py-8 md:px-8 lg:w-1/2">
          <h2 className="text-xl font-semibold text-center text-primary dark:text-white">
            Hello,{" "}
            {userData.first_name || userData.last_name ? (
              <span className="font-bold">
                {userData.first_name} {userData.last_name}
              </span>
            ) : (
              <span className="font-bold">{userData.email}</span>
            )}
          </h2>

          <p className="text-lg text-center text-gray-800 dark:text-gray-200">
            This is your personal page
          </p>

          <form
            className="max-w-4xl p-6 mx-auto"
            noValidate
            onSubmit={(e) => handleSubmit(e)}
          >
            <div className="mt-4">
              <label
                className="mb-2 text-md text-primary dark:text-gray-200"
                htmlFor="first_name"
              >
                First Name
              </label>
              <input
                type="text"
                name="first_name"
                value={userData.first_name || ""}
                onChange={(e) => handleChange(e)}
                className="block mb-6 w-full px-4 py-2 mt-2 text-gray-700 bg-white border border-gray-200 rounded-md dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600 focus:border-blue-400 focus:ring-blue-300 focus:ring-opacity-40 dark:focus:border-blue-300 focus:outline-none focus:ring"
              />
            </div>

            <div className="mt-4 relative">
              <div className="flex justify-between">
                <label
                  className="block text-md text-primary dark:text-gray-200"
                  htmlFor="last_name"
                >
                  Last Name
                </label>
              </div>

              <input
                type="text"
                name="last_name"
                value={userData.last_name || ""}
                onChange={(e) => handleChange(e)}
                className="block w-full px-4 py-2 mt-2 text-gray-700 bg-white border border-gray-200 rounded-md dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600 focus:border-blue-400 focus:ring-blue-300 focus:ring-opacity-40 dark:focus:border-blue-300 focus:outline-none focus:ring"
              />
            </div>

            <div className="mt-4 relative">
              <div className="flex justify-between">
                <label
                  className="block text-md text-primary dark:text-gray-200"
                  htmlFor="phone"
                >
                  Phone
                </label>
              </div>

              <input
                type="text"
                name="phone"
                value={userData.phone || ""}
                onChange={(e) => handleChange(e)}
                className="block w-full px-4 py-2 mt-2 text-gray-700 bg-white border border-gray-200 rounded-md dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600 focus:border-blue-400 focus:ring-blue-300 focus:ring-opacity-40 dark:focus:border-blue-300 focus:outline-none focus:ring"
              />
            </div>

            <div className="mt-4 relative">
              <div className="flex justify-between">
                <label
                  className="block text-md text-primary dark:text-gray-200"
                  htmlFor="title"
                >
                  Title
                </label>
              </div>

              <input
                type="text"
                name="title"
                value={userData.title || ""}
                onChange={(e) => handleChange(e)}
                className="block w-full px-4 py-2 mt-2 text-gray-700 bg-white border border-gray-200 rounded-md dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600 focus:border-blue-400 focus:ring-blue-300 focus:ring-opacity-40 dark:focus:border-blue-300 focus:outline-none focus:ring"
              />
            </div>

            <div className="mt-4 relative">
              <div className="flex justify-between">
                <label
                  className="block text-md text-primary dark:text-gray-200"
                  htmlFor="location"
                >
                  Address
                </label>
              </div>

              <input
                type="text"
                name="location"
                value={userData.location || ""}
                onChange={(e) => handleChange(e)}
                className="block w-full px-4 py-2 mt-2 text-gray-700 bg-white border border-gray-200 rounded-md dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600 focus:border-blue-400 focus:ring-blue-300 focus:ring-opacity-40 dark:focus:border-blue-300 focus:outline-none focus:ring"
              />
            </div>

            <div className="mt-8">
              <button className="w-full px-4 py-2 tracking-wide text-white transition-colors duration-200 transform bg-gray-700 rounded hover:bg-gray-600 focus:outline-none focus:bg-gray-600">
                Save
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export async function getServerSideProps(context) {
  let props = {};
  let req = context.req;
  vcWebsite.getWebPageDataFromRequest(props, req);
  await vcWebsite.getWebPageDataFromDB("prisma", props, props.pageHostPath);
  return { props: props };
}

export default UserArea;
