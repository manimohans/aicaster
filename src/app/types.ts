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
  type?: string;
  title?: string;
  description?: string;
  image?: string;
}

export interface OpenGraphData {
  title?: string;
  description?: string;
  image?: string;
  url?: string;
}

export interface CastData {
  data: {
    type: string;
    fid: number;
    timestamp: number;
    network: string;
    castAddBody: {
      embedsDeprecated: [];
      mentions: [];
      parentUrl: string;
      text: string;
      mentionsPositions: [];
      embeds: Embed[];
    };
  };
  hash: string;
  hashScheme: string;
  signature: string;
  signatureScheme: string;
  signer: string;
  channelTag?: string;
}

export interface UserData {
  pfp: string | null;
  displayName: string;
}

export interface Cast {
  fid: number;
  timestamp: string;
  text: string;
  hash: string;
  embeds: Embed[];
  pfp: string | null;
  displayName: string;
  channelTag: string;
} 