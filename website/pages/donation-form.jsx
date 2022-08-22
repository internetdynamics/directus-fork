import { useState, useEffect, Fragment } from "react";
import { useSession } from "next-auth/react";
import * as yup from "yup";
import { Formik, Form, Field, ErrorMessage } from "formik";
import { toast } from "../utils/toast";
import getUserData from "../helpers/getUserData";
import setDataRest from "../helpers/setDataRest";

const DonationForm = () => {
  const [projects, setProjects] = useState([]);
  const [userData, setUserData] = useState([]);

  const { data: session, status } = useSession({
    required: true
  });

  useEffect(() => {
    async function initialFetch() {
      const user = await getUserData(session.user.accessToken);
      setUserData(user);
      // getProjects();
    }
    if (status === "authenticated") {
      initialFetch();
    }
  }, [status]); // When status changes to authenticated code will execute, going from loading... to authenticated

  // const getProjects = async () => {
  //   // const url = getStrapiURL("/api/projects");
  //   const url = "";

  //   let config = {
  //     method: "get",
  //     url: url,
  //     headers: {
  //       "Content-Type": "application/json",
  //       Authorization: "Bearer <Bearer Token>"
  //     }
  //   };

  //   await axios(config)
  //     .then((response) => {
  //       const projectData = response.data?.data || [];
  //       projectData.sort((a, b) =>
  //         a.attributes.projectName > b.attributes.projectName ? 1 : -1
  //       );
  //       setProjects(projectData);
  //     })
  //     .catch((error) => {
  //       if (error.response) {
  //         let errors = error?.response?.data?.error?.details?.errors;
  //         let singleError = error?.response?.data?.error?.message;

  //         let messages = [];
  //         let message = "";

  //         if (errors) {
  //           for (let error of errors) {
  //             error.message = capitalizeFirstLetter(error.message);
  //             messages.push(error.message);
  //           }
  //           message = messages.join(", ");
  //           console.log("error", message);
  //         } else if (singleError) {
  //           singleError = capitalizeFirstLetter(singleError);
  //           console.log("error", singleError);
  //         }
  //       }
  //     });
  // };

  const LeadSchema = yup.object().shape({
    donorEmail: yup
      .string()
      .email("must be a valid email")
      .required("Email is a required field"),
    donorName: yup.string().required("Name is a required field"),
    donorAddress: yup.string().required("Address is a required field"),
    donorPhone: yup.string().required("Phone is a required field"),
    donationAmount: yup
      .number()
      .required("Amount is a required field")
      .typeError("A number is required, no commas or symbols"),
    donationDate: yup.string().required("Date is a required field"),
    paymentPurpose: yup.string().required("Purpose is a required field"),
    donationMethod: yup.string().required("Method is a required field")
  });

  const renderError = (message) => (
    <p className="text-red-500 h-12 text-sm mt-1 ml-2 text-left">{message}</p>
  );

  return (
    <div className="m-5 pt-5">
      <section className="max-w-4xl p-4 mx-auto bg-gray-100 rounded-md shadow-md dark:bg-gray-800">
        <h2 className="text-lg font-semibold text-gray-700 capitalize dark:text-white">
          Send Donation Information
        </h2>
        <Formik
          enableReinitialize
          initialValues={{
            donorEmail: userData.email || "",
            donorName: userData.first_name + " " + userData.last_name || "",
            donorAddress: userData.location || "",
            donorPhone: userData.phone || "",
            donationAmount: "",
            donationDate: new Date().toLocaleDateString("en-US"),
            paymentPurpose: "donation",
            donationMethod: "zelle",
            project: ""
          }}
          validationSchema={LeadSchema}
          onSubmit={async (values, { setSubmitting, setErrors, resetForm }) => {
            const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;

            let data = {
              donorEmail: values.donorEmail,
              donorName: values.donorName,
              donorAddress: values.donorAddress,
              donorPhone: values.donorPhone,
              donationAmount: values.donationAmount,
              donationDate: new Date(values.donationDate),
              paymentPurpose: values.paymentPurpose,
              donationMethod: values.donationMethod
            };

            if (values.project) {
              data.project = values.project;
            }

            const url = apiBaseUrl + "/items/donation";

            let donationData = {
              donationStatus: "pending",
              donationDate: new Date(values.donationDate),
              donationAmount: values.donationAmount,
              paymentType: values.paymentPurpose,
              donationMethod: values.donationMethod,
              donorEmail: values.donorEmail,
              donorName: values.donorName,
              donorAddress: values.donorAddress,
              donorPhone: values.donorPhone
            };

            if (values.project) {
              donationData.project = values.project;
            }

            const response = await setDataRest(
              session.user.accessToken,
              donationData,
              "donation"
            );

            if (response.errors) {
              toast(
                "error",
                "Donation Submit Failed",
                "An error occurred, please try again"
              );
            } else {
              toast(
                "success",
                "Donation Submit Success",
                "Your Donation / Payment information was sent successfully. Thank You!"
              );
              resetForm();
            }
            setSubmitting(false);
          }}
        >
          {({ errors, touched, isSubmitting }) => (
            <div>
              <Form>
                <div className="grid grid-cols-1 gap-6 mt-4 sm:grid-cols-2">
                  <div>
                    <label
                      className="text-gray-700 dark:text-gray-200"
                      htmlFor="donorName"
                    >
                      Donor Name
                    </label>
                    <Field
                      name="donorName"
                      type="text"
                      className="block w-full px-4 py-2 mt-2 text-gray-700 bg-white border border-gray-200 rounded-md dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600 focus:border-blue-400 focus:ring-blue-300 focus:ring-opacity-40 dark:focus:border-blue-300 focus:outline-none focus:ring"
                    />
                    <ErrorMessage name="donorName" render={renderError} />
                  </div>
                  <div>
                    <label
                      className="text-gray-700 dark:text-gray-200"
                      htmlFor="donorAddress"
                    >
                      Donor Address
                    </label>
                    <Field
                      name="donorAddress"
                      type="text"
                      className="block w-full px-4 py-2 mt-2 text-gray-700 bg-white border border-gray-200 rounded-md dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600 focus:border-blue-400 focus:ring-blue-300 focus:ring-opacity-40 dark:focus:border-blue-300 focus:outline-none focus:ring"
                    />
                    <ErrorMessage name="donorAddress" render={renderError} />
                  </div>
                  <div>
                    <label
                      className="text-gray-700 dark:text-gray-200"
                      htmlFor="donorEmail"
                    >
                      Donor Email
                    </label>
                    <Field
                      name="donorEmail"
                      type="text"
                      className="block w-full px-4 py-2 mt-2 text-gray-700 bg-white border border-gray-200 rounded-md dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600 focus:border-blue-400 focus:ring-blue-300 focus:ring-opacity-40 dark:focus:border-blue-300 focus:outline-none focus:ring"
                    />
                    <ErrorMessage name="donorEmail" render={renderError} />
                  </div>
                  <div>
                    <label
                      className="text-gray-700 dark:text-gray-200"
                      htmlFor="donorPhone"
                    >
                      Donor Phone
                    </label>
                    <Field
                      name="donorPhone"
                      type="text"
                      className="block w-full px-4 py-2 mt-2 text-gray-700 bg-white border border-gray-200 rounded-md dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600 focus:border-blue-400 focus:ring-blue-300 focus:ring-opacity-40 dark:focus:border-blue-300 focus:outline-none focus:ring"
                    />
                    <ErrorMessage name="donorPhone" render={renderError} />
                  </div>
                  <div>
                    <label
                      className="text-gray-700 dark:text-gray-200"
                      htmlFor="donationAmount"
                    >
                      Donation Amount
                    </label>
                    <Field
                      name="donationAmount"
                      type="text"
                      className="block w-full px-4 py-2 mt-2 text-gray-700 bg-white border border-gray-200 rounded-md dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600 focus:border-blue-400 focus:ring-blue-300 focus:ring-opacity-40 dark:focus:border-blue-300 focus:outline-none focus:ring"
                    />
                    <ErrorMessage name="donationAmount" render={renderError} />
                  </div>
                  <div>
                    <label
                      className="text-gray-700 dark:text-gray-200"
                      htmlFor="donationDate"
                    >
                      Donation Date
                    </label>
                    <Field
                      name="donationDate"
                      type="text"
                      className="block w-full px-4 py-2 mt-2 text-gray-700 bg-white border border-gray-200 rounded-md dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600 focus:border-blue-400 focus:ring-blue-300 focus:ring-opacity-40 dark:focus:border-blue-300 focus:outline-none focus:ring"
                    />
                    <ErrorMessage name="donationDate" render={renderError} />
                  </div>
                  <div>
                    <label
                      className="text-gray-700 dark:text-gray-200"
                      htmlFor="paymentPurpose"
                    >
                      Payment Purpose
                    </label>
                    <Field
                      as="select"
                      name="paymentPurpose"
                      className="block w-full px-4 py-2 mt-2 text-gray-700 bg-white border border-gray-200 rounded-md dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600 focus:border-blue-400 focus:ring-blue-300 focus:ring-opacity-40 dark:focus:border-blue-300 focus:outline-none focus:ring"
                    >
                      <option value="donation">Donation</option>
                      <option value="payment">Payment</option>
                    </Field>
                    <ErrorMessage name="paymentPurpose" render={renderError} />
                  </div>
                  <div>
                    <label
                      className="text-gray-700 dark:text-gray-200"
                      htmlFor="donationMethod"
                    >
                      Donation Method
                    </label>
                    <Field
                      as="select"
                      name="donationMethod"
                      className="block w-full px-4 py-2 mt-2 text-gray-700 bg-white border border-gray-200 rounded-md dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600 focus:border-blue-400 focus:ring-blue-300 focus:ring-opacity-40 dark:focus:border-blue-300 focus:outline-none focus:ring"
                    >
                      <option value="zelle">Zelle</option>
                      <option value="wire">Wire</option>
                      <option value="check">Check</option>
                      <option value="cashapp">Cash App</option>
                      <option value="venmo">Venmo</option>
                      <option value="paypal">PayPal</option>
                    </Field>
                    <ErrorMessage name="donationMethod" render={renderError} />
                  </div>
                  <div>
                    <label
                      className="text-gray-700 dark:text-gray-200"
                      htmlFor="project"
                    >
                      Project (optional)
                    </label>
                    <Field
                      as="select"
                      name="project"
                      className="block w-full px-4 py-2 mt-2 text-gray-700 bg-white border border-gray-200 rounded-md dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600 focus:border-blue-400 focus:ring-blue-300 focus:ring-opacity-40 dark:focus:border-blue-300 focus:outline-none focus:ring"
                    >
                      <option value=""></option>

                      {projects.map((project) => (
                        <Fragment key={project.id}>
                          <option value={project.id}>
                            {project.attributes.projectName}
                          </option>
                        </Fragment>
                      ))}
                    </Field>
                  </div>
                </div>
                <div className="flex justify-end mt-6">
                  <button className="px-6 py-2 leading-5 text-white transition-colors duration-200 transform bg-gray-700 rounded-md hover:bg-gray-600 focus:outline-none focus:bg-gray-600">
                    Submit
                  </button>
                </div>
              </Form>
            </div>
          )}
        </Formik>
      </section>
    </div>
  );
};

export default DonationForm;
