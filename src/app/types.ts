export interface Embed {
  url?: string | null;
  castId?: {
    fid: number;
    hash: string;
  };
  cast?: {
    fid: number;
    hash: string;
  };
}

export interface CastData {
  data: {
    type: string;
    fid: number;
    timestamp: number;
    network: string;
    castAddBody: {
      embedsDeprecated: any[];
      mentions: any[];
      parentUrl: string;
      text: string;
      mentionsPositions: any[];
      embeds: Embed[];
    };
  };
  hash: string;
  hashScheme: string;
  signature: string;
  signatureScheme: string;
  signer: string;
  channelTag: string;
}

export interface UserData {
  pfp: string | null;
  displayName: string;
} 