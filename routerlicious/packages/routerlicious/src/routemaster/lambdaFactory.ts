import { IContext, IPartitionLambda, IPartitionLambdaFactory } from "@prague/lambdas";
import * as core from "@prague/services-core";
import * as utils from "@prague/services-utils";
import { EventEmitter } from "events";
import { Provider } from "nconf";
import { DocumentManager } from "./documentManager";
import { RouteMasterLambda } from "./lambda";

export class RouteMasterLambdaFactory extends EventEmitter implements IPartitionLambdaFactory {
    constructor(
        private mongoManager: utils.MongoManager,
        private collection: core.ICollection<any>,
        private deltas: core.ICollection<any>,
        private producer: core.IProducer) {
        super();
    }

    public async create(config: Provider, context: IContext): Promise<IPartitionLambda> {
        const documentId = config.get("documentId");
        const tenantId = config.get("tenantId");

        const documentDetails = await DocumentManager.Create(tenantId, documentId, this.collection, this.deltas);

        return new RouteMasterLambda(documentDetails, this.producer, context);
    }

    public async dispose(): Promise<void> {
        // TODO shut down any created lambdas and wait for all messages to complete?

        const producerClosedP = this.producer.close();
        const mongoClosedP = this.mongoManager.close();
        await Promise.all([producerClosedP, mongoClosedP]);
    }
}
