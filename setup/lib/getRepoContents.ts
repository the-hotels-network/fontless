let getSha = async (org: string, repo: string, path: string, branch?: string): Promise<string> => {
  let res = await fetch(`https://api.github.com/repos/${org}/${repo}/contents?ref=${branch || 'main'}`);
  let data = await res.json();
  let sha = data.filter(c => c.path == path)[0].sha;
  return sha;
};

let getTree = async (org: string, repo: string, sha: string) => {
  let res = await fetch(
    `https://api.github.com/repos/${org}/${repo}/git/trees/${sha}?recursive=1`
  );
  let data = await res.json();
  return data.tree;
};

let getContents = async (
  org: string,
  repo: string,
  files: { path: string; type: string }[],
  path: string = '',
  branch: string = 'main'
) => {
  let filteredFiles = files.filter(f => f.type == 'blob');

  return Promise.all(
    filteredFiles.map(async file => {
      let res = await fetch(
        `https://raw.githubusercontent.com/${org}/${repo}/${branch}/${path}/${file.path}`
      );
      let data = await res.text();
      return {
        contents: data,
        path: file.path
      };
    })
  );
};

export let getRepoContents = async ({
  org,
  repo,
  path,
  branch,
}: {
  org: string;
  repo: string;
  path: string;
  branch?: string;
}) => {
  if (path == '/') path = '';

  let sha = await getSha(org, repo, path, branch);
  if (!sha) return null;

  let files = await getTree(org, repo, sha);
  return getContents(org, repo, files, path, branch);
};
