export class Profile {
  constructor(
    public readonly id: string,
    public readonly userId: string,
    public readonly username: string,
    public readonly displayName: string,
    public readonly avatarUrl: string | null,
    public readonly birthDate: Date,
    public readonly createdAt: Date = new Date(),
  ) {}

  static create(
    id: string,
    userId: string,
    username: string,
    displayName: string,
    avatarUrl: string | null,
    birthDate: Date,
  ): Profile {
    return new Profile(
      id,
      userId,
      username.toLowerCase(),
      displayName,
      avatarUrl,
      birthDate,
    );
  }
}
