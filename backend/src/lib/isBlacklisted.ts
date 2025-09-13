import { getBlacklist } from '../db/operations/blacklist.operation';

async function isBlacklisted(token: string) {
  const blacklist = await getBlacklist(token);

  return !!blacklist;
}

export default isBlacklisted;
