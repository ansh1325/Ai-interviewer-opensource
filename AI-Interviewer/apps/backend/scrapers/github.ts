import axios from "axios";

export async function scrapegithub(username: string) {
  try {
    const userRepos = await axios.get(`https://api.github.com/users/${username}/repos?per_page=10`, {
      headers: { "User-Agent": "AI-Interviewer-Bot" },
      timeout: 4000,
    });

    if (Array.isArray(userRepos.data) && userRepos.data.length > 0) {
      return userRepos.data.map((x: any) => ({
        description: x.description || "",
        name: x.name,
        fullname: x.full_name,
        starCount: x.stargazers_count || 0,
        language: x.language || "TypeScript",
      }));
    }
  } catch (err) {
    console.warn("GitHub direct scrape failed or rate-limited, continuing with general profile context.");
  }

  return [
    {
      name: "portfolio",
      description: "Full-stack software engineering and systems development",
      language: "TypeScript",
    },
  ];
}