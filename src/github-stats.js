const { Construct, CfnOutput, Duration } = require("@aws-cdk/core");
const dynamo = require("@aws-cdk/aws-dynamodb");
const iam = require("@aws-cdk/aws-iam");
const lambda = require("@aws-cdk/aws-lambda");
const events = require("@aws-cdk/aws-events");
const targets = require("@aws-cdk/aws-events-targets");
const path = require("path");

class GitHubStatsWorkflow extends Construct {
  /**
   * A CDK Construct for setting up a workflow for saving statistics on GitHub repos
   * @param {*} scope
   * @param {*} id
   * @param {Object} props
   * @param {String} props.owner
   * @param {String} props.repo
   * @param {boolean} [props.externalUser] - create a user that has read access to the DB and output the access key & secret.
   * @param {String} props.schedule - cron schedule for when datapoints should be saved
   * @param {String} props.githubToken - Personal Access Token to use for lambda function
   */
  constructor(scope, id, props = {}) {
    super(scope, id);

    // Note: The DynamoDB table is not removed on a `cdk destroy <stack>` command
    const database = new dynamo.Table(this, "statsTable", {
      tableName: props.owner + "-" + props.repo + "-stats-table",
      partitionKey: {
        name: "timestamp",
        type: dynamo.AttributeType.NUMBER,
      },
      billingMode: dynamo.BillingMode.PAY_PER_REQUEST,
    });

    const saveFn = new lambda.Function(this, "saveDatapointLambda", {
      code: new lambda.AssetCode(
        path.join(__dirname, "lambdas", "saveDatapoint")
      ),
      functionName: `${props.owner}-${props.repo}-stats-save-datapoint-function`,
      handler: "index.handler",
      runtime: lambda.Runtime.NODEJS_14_X,
      timeout: Duration.seconds(10),
      environment: {
        DYNAMO_TABLE_NAME: database.tableName,
        GITHUB_TOKEN: props.githubToken,
        OWNER: props.owner,
        REPO: props.repo,
      },
    });

    database.grantReadWriteData(saveFn);

    const SaveFnCron = new events.Rule(this, "save-datapoint-fn-cron", {
      schedule: events.Schedule.expression(props.schedule), // ex: "cron(0 * * * ? *)" - once an hour
    });

    SaveFnCron.addTarget(new targets.LambdaFunction(saveFn));

    if (props.externalUser) {
      const userName = `${props.owner}-${props.repo}-stats-user`;

      const user = new iam.User(this, "githubStatsUser", {
        userName,
      });

      const accessKey = new iam.CfnAccessKey(this, "githubStatsToken", {
        userName: user.userName,
      });

      database.grantReadData(user);

      new CfnOutput(this, "accessToken", { value: accessKey.ref });
      new CfnOutput(this, "secretAccessToken", {
        value: accessKey.attrSecretAccessKey,
      });
    }
  }
}

module.exports = {
  GitHubStatsWorkflow,
};
