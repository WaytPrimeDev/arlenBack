export enum KittenStatus {
  ACTIVE = "active",
  BOOKED = "booked",
  OUT = "out",
}

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
  userId: string;
  status: KittenStatus;
  breed: string;
  parentId?: string | null;
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
