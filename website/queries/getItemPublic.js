import axios from "axios";

const getItemPublic = async (tableName) => {
  const url = process.env.NEXT_PUBLIC_API_BASE_URL + "/items/" + tableName;
  let res = {};

  let config = {
    method: "get",
    url: url
  };
  await axios(config)
    .then((response) => {
      res = response.data.data[0];
    })
    .catch((error) => {
      res = null;
    });

  return res;
};

export default getItemPublic;
