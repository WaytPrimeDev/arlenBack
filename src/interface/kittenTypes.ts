export enum KittenStatus {
  OFFLINE = "offline",
  ACTIVE = "active",
  BOOKED = "booked",
  OUT = "out",
}

type Parent = {
  mom: string | null;
  dad: string | null;
};

export enum Sex {
  MALE = "male",
  FEMALE = "female",
}

interface ImagesKitten {
  full: string;
  mobile: string;
  thumbnail: string;
  isMain: boolean;
}

type Price = {
  breeding: string;
  pet: string;
};

export interface KittenDataDto {
  nameUa: string;
  nameEn: string;
  color: string;
  birthDay: Date;
  // userId: string;
  status: KittenStatus;
  breed: string;
  parentId: Parent;
  sex: Sex;
  price: Price;

  images: ImagesKitten[];
}

export interface KittenResponseDto extends KittenDataDto {
  id: string;
}

export interface ParentDataDto {
  name: string;
  color: string;
  birthDay: Date;
  sex: Sex;
  kittens?: string[];
}
