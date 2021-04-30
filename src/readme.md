# cdk-github-stats-construct

A CDK Construct for setting up a workflow for saving statistics on GitHub repos

```js
const githubStats = new GitHubStatsWorkflow(this, "nextjs-github-stats", {
  owner: "vercel",
  repo: "next.js",
  externalUser: true, // generates an IAM user with read permissions to grab the data from the database
  schedule: "cron(0 * * * ? *)", // Once an hour
  githubToken: process.env.GITHUB_TOKEN,
});
```
