import axios from "axios";
const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;

const setDataRest = async (accessToken, data = {}, model) => {
  const url = apiBaseUrl + "/items/" + model;
  let setDataResponse = {};

  let config = {
    method: "post",
    url: url,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`
    },
    data: JSON.stringify(data)
  };

  await axios(config)
    .then((response) => {
      setDataResponse = response.data.data;
    })
    .catch((error) => {
      console.log("setDataRest Error: ", error.toJSON());

      if (error?.response?.data) {
        setDataResponse = error.response.data;
      } else {
        setDataResponse = { errors: ["error"] };
      }
    });

  return setDataResponse;
};

export default setDataRest;
