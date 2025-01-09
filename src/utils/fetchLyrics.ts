import axios from "axios";

const fetchLyrics = async (artist: string, title: string) => {
  try {
    const response = await axios.get("https://lrclib.net//api/get", {
      params: {
        artist_name: artist,
        track_name: title,
      },
      headers: {
        "Lrclib-Client": "MyMusicApp/1.0 (https://example.com)", // Replace with your app's details
      },
    });
    console.log("Lyrics response:", response.data.plainLyrics);
    return response.data.plainLyrics;
  } catch (error: unknown) {
    if (axios.isAxiosError(error)) {
      console.error(
        "Error fetching lyrics:",
        error.response?.data || error.message
      );
    } else {
      console.error("An unexpected error occurred:", error);
    }
    return "Error fetching lyrics";
  }
};

export default fetchLyrics;
