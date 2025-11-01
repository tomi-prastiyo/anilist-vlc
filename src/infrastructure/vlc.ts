import axios from "axios";
import convert from "xml-js";
import { config } from "../utils/config";

const getXMLString = async (): Promise<string | null> => {
  const baseUrl: string = `http://localhost:${config.vlcPort}/requests/status.xml`;

  try {
    const response = await axios.get(baseUrl, {
      auth: {
        username: "",
        password: config.vlcPassword,
      },
    });

    return response.data;
  } catch (error) {
    console.error("Error fetching XML:", error);
    return null;
  }
};

const convertXML = (xmlString: string): string => {
  const options = {
    compact: true,
    spaces: 4,
    trim: true,
    ignoreDeclaration: true,
    ignoreInstruction: true,
    ignoreComment: true,
    ignoreCdata: true,
    ignoreDoctype: true,
  };

  return convert.xml2json(xmlString, options);
};

const getTitle = (xmlObject: any): string => {
  const metaData = xmlObject.information.category[0];
  if (metaData.info.length === undefined) {
    return metaData.info._text;
  }

  const attributes: string[] = metaData.info.map(
    (element: any) => element._attributes.name
  );
  const names: string[] = metaData.info.map((element: any) => element._text);

  if (attributes.indexOf("filename") !== undefined) {
    const filenameIndex: number = attributes.indexOf("filename");
    return names[filenameIndex];
  }

  if (attributes.indexOf("title") !== undefined) {
    const titleIndex: number = attributes.indexOf("title");
    return names[titleIndex];
  }

  return "";
};

const getStatus = async (): Promise<any | null> => {
  try {
    const xmlString: string | null = await getXMLString();
    if (!xmlString) return null;

    const xmlObject: any = JSON.parse(convertXML(xmlString)).root;

    const status = {
      title: getTitle(xmlObject),
      length: xmlObject.length._text,
      time: xmlObject.time._text,
      state: xmlObject.state._text,
    };

    return status;
  } catch (error) {
    console.error("Error getting status:", error);
    return null;
  }
};

export default getStatus;
