import axios, { AxiosRequestConfig, AxiosResponse } from "axios";
import { config } from "../../utils/config";

const tokenEndpoint: string = "https://anilist.co/api/v2/oauth/token";

const generateToken = async () => {
  const options: AxiosRequestConfig = {
    method: "POST",
    url: tokenEndpoint,
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    data: {
      grant_type: "authorization_code",
      client_id: config.anilistClientId,
      client_secret: config.anilistClientSecret,
      redirect_uri: config.anilistRedirect,
      code: config.anilistAuth,
    },
  };

  try {
    const response: AxiosResponse = await axios(options);
    if (response.status === 200) {
      console.log("Token: ", response.data.access_token);
    } else {
      console.log(response);
    }
  } catch (error) {
    console.log("Error making request:", error);
  }
};

export default generateToken;
