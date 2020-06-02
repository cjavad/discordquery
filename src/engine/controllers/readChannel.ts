import { TextChannel, DMChannel, ChannelLogsQueryOptions, Collection, Snowflake, Message } from 'discord.js';

/**
 * Gets a list of messages from channel with options
 * @param channel - Discord channel to read messages from
 * @param options - ChannelLogsQueryOptions query options
 */
export default async function readChannel ( channel: TextChannel | DMChannel, options?: ChannelLogsQueryOptions): Promise<Collection<string, Message>> {
    const limit: number = options?.limit || 50;
    delete options?.limit;

    return new Promise((resolve, reject) => {
        let concatenated: Collection<Snowflake, Message>;

        channel.messages.fetch({ limit: limit < 100 ? limit : 100, ...options })
            .then(collection => {
                const nextBatch = (): void => {
                    const remaining = limit - collection.size;

                    if (remaining <= 0) return resolve(collection);

                    delete options?.before;
                    channel.messages.fetch({ limit: remaining < 100 ? remaining : 100, before: collection.lastKey(), ...options })
                        .then(next => {
                            concatenated = collection.concat(next);

                            if (collection.size >= limit || collection.size === concatenated.size) return resolve(concatenated);

                            collection = concatenated;
                            nextBatch();
                        })
                        .catch(error => reject(error));
                };

                nextBatch();
            })
            .catch(error => reject(error));
    });
}