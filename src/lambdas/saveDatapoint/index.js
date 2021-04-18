const fetch = require("node-fetch");
const dayjs = require("dayjs");

const AWS = require("aws-sdk");

AWS.config.update({
  region: "us-east-1",
});

const documentClient = new AWS.DynamoDB.DocumentClient({
  apiVersion: "2012-08-10",
});

let query = JSON.stringify({
  query: `
    query {
      repository(owner: "${process.env.OWNER}", name:"${process.env.REPO}") {
        openIssues: issues(states:OPEN) {
          totalCount
        }
        closedIssues: issues(states:CLOSED) {
          totalCount
        }
        openPRs: pullRequests(states:OPEN) {
          totalCount
        }
        closedPRs: pullRequests(states:CLOSED) {
          totalCount
        }
        mergedPRs: pullRequests(states:MERGED) {
          totalCount
        }
        stargazers {
          totalCount
        }
      }
    }`,
});

function queryGitHub(query) {
  const url = "https://api.github.com/graphql";
  const options = {
    method: "POST",
    body: query,
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      Authorization: `bearer ${process.env.GITHUB_TOKEN}`,
    },
  };

  return fetch(url, options)
    .then((resp) => resp.json())
    .then((data) => {
      return data.data.repository;
    });
}

exports.handler = async () => {
  let resp = await queryGitHub(query);

  let now = dayjs().unix();

  await documentClient
    .put({
      TableName: process.env.DYNAMO_TABLE_NAME,
      Item: {
        timestamp: now,
        openIssues: resp.openIssues.totalCount,
        closedIssues: resp.closedIssues.totalCount,
        openPRs: resp.openPRs.totalCount,
        closedPRs: resp.closedPRs.totalCount,
        mergedPRs: resp.mergedPRs.totalCount,
        stars: resp.stargazers.totalCount,
      },
    })
    .promise();
};
