const removeBracketed = (title: string): string =>
  title.replace(/[\s_.]*\[[^\]]*\][\s_.]*/g, "");
const removeParends = (title: string): string =>
  title.replace(/ *\([^)]*\) */g, "");
const removeFileExtension = (title: string): string =>
  title.endsWith(".mkv") || title.endsWith(".mp4") ? title.slice(0, -4) : title;
const replaceDelimiter = (title: string): string =>
  title.replace(/[\._]/g, " ");
const validEp = (episode: RegExpMatchArray | null): boolean =>
  episode !== null && !isNaN(Number(episode[1]));

const getEpisode = (details: string): [string, string] => {
  let parts: string[] = [details];

  if (details.includes("-")) {
    parts = parts.concat(details.substring(0, details.indexOf("-")).trim());
    parts = parts.concat(details.substring(details.indexOf("-") + 1).trim());
  }

  for (let part of parts) {
    let match: RegExpMatchArray | any = part.match(/(episode\s?|ep|e)(\d+)/i);
    if (match && !isNaN(Number(match[2])))
      return [part.replace(match[0], ""), match[2]];
    match = part.match(/\d+x(\d+)/i);
    if (validEp(match)) return [part.replace(match[0], ""), match[1]];
    match = part.match(/(\d+)v\d+/i);
    if (validEp(match)) return [part.replace(match[0], ""), match[1]];
    match = part.match(/(\d+)$/i);
    if (validEp(match)) return [part.replace(match[0], ""), match[1]];
    match = part.match(/(\d+)/i);
    if (validEp(match)) return [part.replace(match[0], ""), match[1]];
  }

  return [parts.join(", "), ""];
};

const parseTitle = (title: string): { title: string; episode: string } => {
  let parsedTitle: string = title.trim();

  if (parsedTitle.includes("&#39;")) {
    parsedTitle = parsedTitle.replace(/&#39;/g, "'");
  }

  if (parsedTitle.includes(".mkv") || parsedTitle.includes(".mp4")) {
    parsedTitle = removeFileExtension(parsedTitle);
  }

  if (parsedTitle.includes("]")) {
    parsedTitle = removeBracketed(parsedTitle);
  }

  if (parsedTitle.includes(")")) {
    parsedTitle = removeParends(parsedTitle);
  }

  if (!parsedTitle.includes(" ")) {
    parsedTitle = replaceDelimiter(parsedTitle);
  }

  parsedTitle = parsedTitle
    .replace(" Episode Movie", " Episode 01")
    .replace(" Episode OVA", " Episode")
    .replace(" END Subbed", "")
    .replace(" Subbed", "")
    .replace("BD", "");

  let [result, episodeNumber] = getEpisode(parsedTitle);

  if (result.includes(" - ")) {
    result = result.substring(0, result.indexOf(" - "));
  }

  return {
    title: result.trim(),
    episode: episodeNumber,
  };
};

export default parseTitle;
