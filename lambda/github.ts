import { Octokit } from '@octokit/core';
import { paginateGraphQL, paginateGraphQLInterface } from '@octokit/plugin-paginate-graphql';
import { Endpoints } from '@octokit/types';
import { PaginateInterface, paginateRest } from '@octokit/plugin-paginate-rest';

import { Logger } from '@aws-lambda-powertools/logger';

import {
  listOrganizationsQuery,
  listCurrentUserRepositoriesQuery,
  listOrganizationRepositoriesQuery,
} from './constants';


type OctokitInstance = Octokit & paginateGraphQLInterface & {
  paginate: PaginateInterface
};

const logger = new Logger();

interface ListOrganizationsResponse {
  viewer: {
    organizations: {
      nodes: {
        name: string
      }[],
    },
  },
};

interface listCurrentUserRepositoriesResponse {
  viewer: {
    login: string
    repositories: {
      nodes: {
        name: string
        nameWithOwner: string
      }[],
    },
  },
};

interface listOrganizationRepositoriesResponse {
  organization: {
    login: string
    repositories: {
      nodes: {
        name: string
        nameWithOwner: string
      }[],
    },
  },
};

export function newOctokit(token: string): OctokitInstance {
  const MyOctokit = Octokit.plugin(paginateGraphQL, paginateRest);
  return new MyOctokit({ auth: token });
}

export async function listOrganizations(octokit: OctokitInstance): Promise<string[]> {
  const response = await octokit.graphql.paginate<ListOrganizationsResponse>(listOrganizationsQuery);
  return response.viewer.organizations.nodes.map((node) => node.name);
}

export async function listCurrentUserRepositories(
  octokit: OctokitInstance,
): Promise<{ name: string; nameWithOwner: string, owner: string }[]> {
  const response = await octokit.graphql.paginate<listCurrentUserRepositoriesResponse>(
    listCurrentUserRepositoriesQuery);

  const repositories = response.viewer.repositories;
  const owner = response.viewer.login;
  return repositories.nodes.map((node) => ({
    owner,
    name: node.name,
    nameWithOwner: node.nameWithOwner,
  }));
}

export async function listOrganizationRepositories(
  octokit: OctokitInstance, org: string,
): Promise<{ name: string; nameWithOwner: string, owner: string }[]> {
  const response = await octokit.graphql.paginate<listOrganizationRepositoriesResponse>(
    listOrganizationRepositoriesQuery, {
      login: org,
    },
  );

  const repositories = response.organization.repositories;
  const owner = response.organization.login;
  return repositories.nodes.map((node) => ({
    owner,
    name: node.name,
    nameWithOwner: node.nameWithOwner,
  }));
}

export async function allRepositories(octokit: OctokitInstance): Promise<{
  owner: string;
  name: string;
  nameWithOwner: string;
}[]> {
  const userRepos = await listCurrentUserRepositories(octokit);
  logger.debug(JSON.stringify(userRepos));
  const orgs = await listOrganizations(octokit);
  const repos = (await Promise.all(orgs.map((org) => listOrganizationRepositories(octokit, org)))).flat();
  logger.debug(JSON.stringify(repos));
  return repos.concat(userRepos);
}

type GetSbomResponse = Endpoints['GET /repos/{owner}/{repo}/dependency-graph/sbom']['response']['data'];

export async function getSbom(
  octokit: OctokitInstance,
  { owner, repo }: { owner: string, repo: string },
) {
  return octokit.paginate<GetSbomResponse>(
    '/repos/{owner}/{repo}/dependency-graph/sbom', {
      owner,
      repo,
      method: 'GET',
      headers: {
        'X-GitHub-Api-Version': '2022-11-28',
      },
      per_page: 100,
    },
  );
}
