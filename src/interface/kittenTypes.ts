export enum KittenStatus {
  ACTIVE = "active",
  BOOKED = "booked",
  OUT = "out",
}

interface ImagesKitten {
  full: string;
  isMain: boolean;
}

export interface KittenDataDto {
  status: KittenStatus;
  name: string;
  color: string;
  filePath: string;
  birthDay: Date;
  images: ImagesKitten[];
}
