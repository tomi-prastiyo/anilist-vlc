import axios from "axios";
import convert from "xml-js";
import {
  IMediaPlayerAdapter,
  PlaybackStatus,
  PlaybackState,
} from "../../domain";

interface VlcConfig {
  host: string;
  port: number;
  password: string;
}

/**
 * VLC Media Player Adapter
 * Implements IMediaPlayerAdapter for VLC HTTP interface
 */
export class VlcPlayerAdapter implements IMediaPlayerAdapter {
  private readonly baseUrl: string;
  private readonly auth: { username: string; password: string };

  constructor(config: VlcConfig) {
    this.baseUrl = `http://${config.host}:${config.port}/requests/status.xml`;
    this.auth = { username: "", password: config.password };
  }

  async getPlaybackStatus(): Promise<PlaybackStatus | null> {
    try {
      const xmlString = await this.fetchStatusXml();
      if (!xmlString) return null;

      return this.parseStatusXml(xmlString);
    } catch (error) {
      console.error("Error getting VLC status:", error);
      return null;
    }
  }

  private async fetchStatusXml(): Promise<string | null> {
    try {
      const response = await axios.get(this.baseUrl, { auth: this.auth });
      return response.data;
    } catch (error) {
      console.error("Error fetching VLC XML:", error);
      return null;
    }
  }

  private parseStatusXml(xmlString: string): PlaybackStatus {
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

    const xmlObject = JSON.parse(convert.xml2json(xmlString, options)).root;

    return {
      title: this.extractTitle(xmlObject),
      length: Number(xmlObject.length._text),
      time: Number(xmlObject.time._text),
      state: xmlObject.state._text as PlaybackState,
    };
  }

  private extractTitle(xmlObject: any): string {
    const metaData = xmlObject.information?.category?.[0];
    if (!metaData?.info) return "";

    // Single info element
    if (metaData.info.length === undefined) {
      return metaData.info._text || "";
    }

    // Multiple info elements - find filename or title
    const attributes: string[] = metaData.info.map(
      (el: any) => el._attributes?.name,
    );
    const values: string[] = metaData.info.map((el: any) => el._text);

    const filenameIndex = attributes.indexOf("filename");
    if (filenameIndex !== -1) return values[filenameIndex];

    const titleIndex = attributes.indexOf("title");
    if (titleIndex !== -1) return values[titleIndex];

    return "";
  }
}
