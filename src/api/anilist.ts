import { config } from "../utils/config";

const apiUrl: string = "https://graphql.anilist.co";

const getData = async (
  query: string,
  variables: Record<string, any>
): Promise<any> => {
  const options: RequestInit = {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({ query, variables }),
  };

  const response: Response = await fetch(apiUrl, options);
  const data: any = await response.json();

  return data;
};

const userWatchingList = async (): Promise<any[]> => {
  const query: string = `
    query ($page: Int, $perPage: Int, $userName: String) {
      Page (page: $page, perPage: $perPage) {
        pageInfo {
          currentPage
          hasNextPage
        }
        mediaList (userName: $userName, status_in: [PLANNING, CURRENT, REPEATING], type: ANIME, sort:MEDIA_TITLE_ROMAJI) {
          mediaId
          media {
            title {
              romaji
            }
          }
          progress
        }
      }
    }
  `;

  const variables: { page: number; perPage: number; userName: string } = {
    page: 1,
    perPage: 50,
    userName: config.anilistUsername,
  };

  const data: any = await getData(query, variables);

  let mediaList: any[] = data.data.Page.mediaList;

  while (data.data.Page.pageInfo.hasNextPage) {
    const nextPage: number = data.data.Page.pageInfo.currentPage + 1;
    const nextData: any = await getData(query, {
      ...variables,
      page: nextPage,
    });
    mediaList = [...mediaList, ...nextData.data.Page.mediaList];
    data.data.Page = nextData.data.Page;
  }

  return mediaList;
};

const mediaIdList = async (title: string): Promise<any[]> => {
  const query: string = `
    query ($page: Int, $perPage: Int, $search: String) {
      Page (page: $page, perPage: $perPage) {
        media (search: $search) {
          id
          title {
            romaji 
          }
        }
      }
    }
  `;

  const variables: { search: string; page: number; perPage: number } = {
    search: title,
    page: 1,
    perPage: 20,
  };

  const data: any = await getData(query, variables);

  return data.data.Page.media;
};

const getMediaId = async (title: string): Promise<number | undefined> => {
  const watchingList: any[] = await userWatchingList();
  const mediaList: any[] = await mediaIdList(title);
  const userMediaIds: number[] = watchingList.map((media) => media.mediaId);
  const mediaIds: number[] = mediaList.map((media) => media.id);

  return userMediaIds.find((userId) => mediaIds.includes(userId));
};

const getMediaStatus = async (mediaId: number | undefined): Promise<string> => {
  const query: string = `
    query ($page: Int, $perPage: Int, $userName: String, $mediaId: Int) {
      Page (page: $page, perPage: $perPage) {
        mediaList (userName: $userName, mediaId: $mediaId, type: ANIME) {
          status
        }
      }
    }
  `;

  const variables: {
    page: number;
    perPage: number;
    userName: string;
    mediaId: number | undefined;
  } = {
    page: 1,
    perPage: 50,
    userName: config.anilistUsername,
    mediaId,
  };

  const data: any = await getData(query, variables);

  return data.data.Page.mediaList[0].status;
};

const updateEpisodeCount = async (
  mediaId: number | undefined,
  episode: number
): Promise<any> => {
  const mediaStatus: string = await getMediaStatus(mediaId);

  let query: string = `
    mutation ($mediaId: Int, $progress: Int) {
      SaveMediaListEntry (mediaId: $mediaId, progress: $progress) {
        id
        progress
      }
    }
  `;

  let variables: {
    mediaId: number | undefined;
    progress: number;
    status?: string;
  } = {
    mediaId,
    progress: episode,
  };

  if (mediaStatus === "PLANNING") {
    query = `
      mutation ($mediaId: Int, $progress: Int, $status: MediaListStatus) {
        SaveMediaListEntry (mediaId: $mediaId, progress: $progress, status: $status) {
          id
          progress
          status
        }
      }
    `;

    variables = {
      mediaId,
      progress: episode,
      status: "CURRENT",
    };
  }

  const options: RequestInit = {
    method: "POST",
    headers: {
      Authorization: `Bearer ${config.anilistToken}`,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({ query, variables }),
  };

  const response: Response = await fetch(apiUrl, options);
  const data: any = await response.json();

  return data;
};

const currentEpisode = async (title: string): Promise<number | undefined> => {
  const mediaId: number | undefined = await getMediaId(title);

  const query: string = `
    query ($mediaId: Int, $userName: String) {
      MediaList (mediaId: $mediaId, userName: $userName) {
        progress
      }
    } 
  `;

  const variables: { mediaId: number | undefined; userName: string } = {
    mediaId,
    userName: config.anilistUsername,
  };

  const data: any = await getData(query, variables);

  return data.data.MediaList.progress;
};

const anilistUpdate = async (title: string, episode: number): Promise<void> => {
  const mediaId: number | undefined = await getMediaId(title);
  const response: any = await updateEpisodeCount(mediaId, episode);
  console.log(
    `Updated AniList: ${title} - Episode ${response.data.SaveMediaListEntry.progress}`
  );
};

const aniImage = async (title: string): Promise<any> => {
  const mediaId: number | undefined = await getMediaId(title);

  const query: string = `
    query ($mediaId: Int) {
      Media(id: $mediaId) {
        title {
          romaji
        }
        coverImage {
          large
        }
      }
    }
  `;

  const variables: { mediaId: number | undefined } = {
    mediaId,
  };

  const data: any = await getData(query, variables);

  return data.data.Media;
};

const userData = async (): Promise<any> => {
  const query: string = `
    query ($name: String) {
      User(name: $name) {
        avatar {
          large
        }
      }
    }
  `;

  const variables: { name: string } = {
    name: config.anilistUsername,
  };

  const data: any = await getData(query, variables);

  return data.data.User;
};

export { anilistUpdate, currentEpisode, aniImage, userData };
