/**
 * SqsController
 *
 * @description :: Server-side logic for managing sqs
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */

module.exports = {

  /**
   * `SqsController.send()`
	 * curl -H "Content-Type: application/json" -X POST -d '{"name":"test_event", "data": {"id":123, "title": "my fancy title"}}' http://localhost:1337/send
   */
  send: function (req, res) {
    var AWS = require('aws-sdk');
    AWS.config.update({region: 'ap-southeast-1'});
    var sqs = new AWS.SQS();

    var params = {
      MessageBody: JSON.stringify(req.body['data']),
      MessageAttributes: {
        'name': {
          DataType: 'String',
          StringValue: req.body['name']
        }
      },
      QueueUrl: 'SQS_QUEUE_URL'
    };

    sqs.sendMessage(params, function (err, data) {
      if (err) {
        console.log(err, err.stack);
        return res.serverError({'error': err.message});
      } else {
        return res.json(data);
      }
    });
  },

  /**
   * `SqsController.receive()`
	 * curl -H "Content-Type: application/json" http://localhost:1337/receive
   */
  receive: function (req, res) {
    var AWS = require('aws-sdk');
    AWS.config.update({region: 'ap-southeast-1'});
    var sqs = new AWS.SQS();

    var queueURL = 'SQS_QUEUE_URL';

    var params = {
      AttributeNames: [
        'All'
      ],
      MaxNumberOfMessages: 1,
      MessageAttributeNames: [
        'All'
      ],
      QueueUrl: queueURL,
      VisibilityTimeout: 5,
      WaitTimeSeconds: 0
    };

    sqs.receiveMessage(params, function (err, jobData) {
      if (err) {
        console.error(err, err.stack);
        return res.serverError({'error': err.message});
      } else {
        if (jobData.Messages) {
          var deleteParams = {
            QueueUrl: queueURL,
            ReceiptHandle: jobData.Messages[0].ReceiptHandle
          };
          sqs.deleteMessage(deleteParams, function (err, data) {
            if (err) {
              console.error('Error deleting SQS job', err, err.stack);
            } else {
              console.log('Message Deleted', data);
            }
          });
          return res.json(jobData);
        } else {
          return res.json({'empty': true, 'message': 'No remaining jobs in queue'});
        }
      }
    });
  }
};
