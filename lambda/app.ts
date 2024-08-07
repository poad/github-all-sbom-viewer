import {
  newOctokit,
  allRepositories,
  getSbom,
} from './github';

export async function listSboms(token: string) {
  const octokit = newOctokit(token);

  const repos = await allRepositories(octokit);
  const sboms = await Promise.all(
    repos.map((repo) => getSbom(octokit, { owner: repo.owner, repo: repo.name })
      .then((items) => items.map((item) => ({ ...item, owner: repo.owner, repo: repo.name })))
      .catch(() => undefined)));
  return sboms.flat();
}
