import { Directus } from "@directus/sdk";
import Head from "next/head";
import { toast } from "../utils/toast";
import { deleteUser, getUser } from "../queries/Users";
import { useMutation } from "react-query";
import setData from "../helpers/setData";
import vcWebsite from "../lib/VCWebsite";

const fetchData = async (query, variables = {}) => {
  const headers = {
    "Content-Type": "application/json"
  };

  const res = await fetch(
    process.env.NEXT_PUBLIC_API_BASE_URL + "/graphql/system",
    {
      method: "POST",
      headers,
      body: JSON.stringify({
        query,
        variables
      })
    }
  );

  const json = await res.json();

  if (json.errors) {
    throw new Error(json.errors);
  }

  return json.data.users;
};

function SignUp() {
  const directus = new Directus(process.env.NEXT_PUBLIC_API_BASE_URL);
  const userRole = process.env.NEXT_PUBLIC_DEFAULT_USER_ROLE;

  const deleteUserMutation = useMutation((user) => {
    setData(deleteUser, { data: user.id }, "/system").then((response) => {});
  });

  const handleSubmit = async (e) => {
    e.preventDefault();

    const emailformat = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
    if (!e.target.email.value.match(emailformat)) {
      return toast(
        "warning",
        "Incorrect Email Format",
        "Please provide a valid email"
      );
    }

    try {
      // Check if user exists and active, if so, request a password rest forr user
      const user = await fetchData(getUser, {
        email: e.target.email.value
      });

      if (
        user[0] &&
        user[0].email === e.target.email.value &&
        user[0].status === "active"
      ) {
        return toast(
          "warning",
          "This Email Address is Currently Active",
          "You may want to request a password reset"
        );
      }

      // Check if user exists and invited, if so, delete user
      if (
        user[0] &&
        user[0].email === e.target.email.value &&
        user[0].status === "invited"
      ) {
        deleteUserMutation.mutate({
          id: user[0].id
        });
      }

      try {
        // invite user
        await directus.users.invites.send(
          e.target.email.value,
          userRole,
          process.env.NEXT_PUBLIC_NEXT_URL + "/sign-up"
        );
        toast(
          "success",
          "Invitation Request Successful",
          "Please check your email for further instructions"
        );
      } catch (err) {
        let message = "An error occurred, please try again";
        if (err.message) {
          message = err.message.replace("email", "Email Address");
        }
        toast("error", "Sign Up Request Failed", message);
      }
    } catch (err) {
      toast(
        "error",
        "Request Invitation",
        "An error occurred, please try again."
      );
    }
  };

  return (
    <div className="ml-5 mr-5">
      <Head>
        <title>Request Invitation</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <div className="flex m-10 w-full max-w-md mx-auto overflow-hidden bg-white rounded-lg shadow-lg dark:bg-gray-800 lg:max-w-4xl">
        <div
          className="hidden bg-cover lg:block lg:w-1/2"
          style={{
            backgroundImage: "url('/images/hands-1053x1424.png')",
            boxShadow: "0 0 8px 8px #F3F4F6 inset"
          }}
        ></div>

        <div className="w-full px-6 py-8 md:px-8 lg:w-1/2">
          <h2 className="text-2xl font-semibold text-center text-black dark:text-white">
            Virtual Christianity
          </h2>

          <p className="text-xl text-center text-gray-800 dark:text-gray-200">
            Welcome!
          </p>

          <form
            className="max-w-4xl p-6 mx-auto"
            noValidate
            onSubmit={(e) => handleSubmit(e)}
          >
            <div className="mt-4">
              <label
                className="mb-2 text-md text-black dark:text-gray-200"
                htmlFor="emailAddress"
              >
                Email Address
              </label>
              <input
                type="text"
                name="email"
                className="block mb-4 w-full px-4 py-2 mt-2 text-gray-700 bg-white border border-gray-200 rounded-md dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600 focus:border-blue-400 focus:ring-blue-300 focus:ring-opacity-40 dark:focus:border-blue-300 focus:outline-none focus:ring"
              />
            </div>

            <div className="mt-8">
              <button className="w-full px-4 py-2 tracking-wide text-white transition-colors duration-200 transform bg-gray-700 rounded hover:bg-gray-500 focus:outline-none focus:bg-gray-600">
                Request Invitation
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
  await vcWebsite.getWebPageDataFromDatabase(props, props.pageHostPath);
  return { props: props };
}

export default SignUp;
