import { initAuthCreds, BufferJSON, AuthenticationState, SignalDataTypeMap } from '@whiskeysockets/baileys';
import { proto } from '@whiskeysockets/baileys/WAProto';
import { WhatsAppAuth } from '@/models/WhatsAppAuth';

export const useMongoDBAuthState = async (): Promise<{ state: AuthenticationState, saveCreds: () => Promise<void> }> => {
    const writeData = async (data: any, id: string) => {
        const informationToStore = JSON.parse(JSON.stringify(data, BufferJSON.replacer));
        await WhatsAppAuth.updateOne({ _id: id }, { data: informationToStore }, { upsert: true });
    };

    const readData = async (id: string) => {
        const data = await WhatsAppAuth.findOne({ _id: id });
        if (data && data.data) {
            return JSON.parse(JSON.stringify(data.data), BufferJSON.reviver);
        }
        return null;
    };

    const removeData = async (id: string) => {
        await WhatsAppAuth.deleteOne({ _id: id });
    };

    let creds = await readData('creds');
    if (!creds) {
        creds = initAuthCreds();
        await writeData(creds, 'creds');
    }

    return {
        state: {
            creds,
            keys: {
                get: async (type: string, ids: string[]) => {
                    const data: { [key: string]: any } = {};
                    await Promise.all(
                        ids.map(async (id) => {
                            let value = await readData(`${type}-${id}`);
                            if (type === 'app-state-sync-key' && value) {
                                value = proto.Message.AppStateSyncKeyData.fromObject(value);
                            }
                            data[id] = value;
                        })
                    );
                    return data;
                },
                set: async (data: any) => {
                    const tasks: Promise<any>[] = [];
                    for (const category in data) {
                        for (const id in data[category as keyof typeof data]) {
                            const value = data[category as keyof typeof data][id];
                            const key = `${category}-${id}`;
                            tasks.push(value ? writeData(value, key) : removeData(key));
                        }
                    }
                    await Promise.all(tasks);
                }
            }
        },
        saveCreds: () => {
            return writeData(creds, 'creds');
        }
    };
};
