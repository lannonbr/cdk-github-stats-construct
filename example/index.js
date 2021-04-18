const cdk = require("@aws-cdk/core");
const { GitHubStatsWorkflow } = require("cdk-github-stats-construct");

class GatsbyGitHubStatsStack extends cdk.Stack {
  constructor(app, id) {
    super(app, id);

    new GitHubStatsWorkflow(this, "gatsby-github-stats", {
      owner: "gatsbyjs",
      repo: "gatsby",
      externalUser: true,
      schedule: "cron(0 * * * ? *)", // Once an hour
      githubToken: process.env.GITHUB_TOKEN,
    });
  }
}

const app = new cdk.App();
new GatsbyGitHubStatsStack(app, "gatsby-github-stats-app");
app.synth();
