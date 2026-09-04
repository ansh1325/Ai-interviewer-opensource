export const runtime = 'edge';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const username = searchParams.get('username')?.trim();

  if (!username) {
    return new Response(JSON.stringify({ error: 'Username query parameter is required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  try {
    const headers = {
      'User-Agent': 'InterviewerAI-EdgeFunction',
      'Accept': 'application/vnd.github.v3+json'
    };

    // 1. Fetch user profile
    const userRes = await fetch(`https://api.github.com/users/${encodeURIComponent(username)}`, { headers });
    if (!userRes.ok) {
      if (userRes.status === 404) {
        return new Response(JSON.stringify({ error: `GitHub user "${username}" not found.` }), {
          status: 404,
          headers: { 'Content-Type': 'application/json' }
        });
      }
      return new Response(JSON.stringify({ error: `GitHub API error: ${userRes.statusText}` }), {
        status: userRes.status,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const userData = await userRes.json();

    // 2. Fetch top public repos
    const reposRes = await fetch(
      `https://api.github.com/users/${encodeURIComponent(username)}/repos?sort=updated&per_page=8`,
      { headers }
    );
    const reposData = reposRes.ok ? await reposRes.json() : [];

    // Analyze languages and top projects
    const languagesMap: Record<string, number> = {};
    const projects = reposData.map((r: any) => {
      if (r.language) {
        languagesMap[r.language] = (languagesMap[r.language] || 0) + 1;
      }
      return {
        name: r.name,
        language: r.language || 'General',
        stars: r.stargazers_count || 0,
        description: r.description || 'Public GitHub project'
      };
    });

    const topLanguages = Object.entries(languagesMap)
      .sort((a, b) => b[1] - a[1])
      .map(([lang]) => lang);

    // Auto-detect recommended domain
    let suggestedDomain = 'fullstack';
    const topL = topLanguages.join(' ').toLowerCase();
    if (topL.includes('typescript') || topL.includes('javascript') || topL.includes('html')) {
      suggestedDomain = 'frontend';
    } else if (topL.includes('python') || topL.includes('go') || topL.includes('rust') || topL.includes('java')) {
      suggestedDomain = 'backend';
    }

    const summary = `GitHub Profile: @${userData.login} (${userData.name || userData.login}). ${userData.public_repos} public repos. Primary stack: ${topLanguages.slice(0, 4).join(', ') || 'Software Engineering'}. Top projects: ${projects.slice(0, 3).map((p: any) => p.name).join(', ')}.`;

    return new Response(JSON.stringify({
      username: userData.login,
      name: userData.name || userData.login,
      avatarUrl: userData.avatar_url,
      bio: userData.bio || '',
      publicRepos: userData.public_repos,
      followers: userData.followers,
      topLanguages,
      projects: projects.slice(0, 5),
      suggestedDomain,
      resumeSummary: summary
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'X-Edge-Runtime': 'v8-isolate',
        'Cache-Control': 'public, s-maxage=120, stale-while-revalidate=600'
      }
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Failed to fetch GitHub profile';
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
