export class Profile {
  constructor(
    public readonly id: string,
    public readonly userId: string,
    public readonly username: string,
    public readonly displayName: string,
    public readonly avatarUrl: string | null,
    public readonly birthDate: Date,
    public readonly bio: string | null,
    public readonly website: string | null,
    public readonly location: string | null,
    public readonly createdAt: Date = new Date(),
  ) {}

  static create(
    id: string,
    userId: string,
    username: string,
    displayName: string,
    avatarUrl: string | null,
    birthDate: Date,
    bio: string | null = null,
    website: string | null = null,
    location: string | null = null,
  ): Profile {
    return new Profile(
      id,
      userId,
      username.toLowerCase(),
      displayName,
      avatarUrl,
      birthDate,
      bio,
      website,
      location,
    );
  }

  update(payload: {
    username?: string;
    displayName?: string;
    avatarUrl?: string | null;
    birthDate?: Date;
    bio?: string | null;
    website?: string | null;
    location?: string | null;
  }): Profile {
    return new Profile(
      this.id,
      this.userId,
      payload.username?.toLowerCase() ?? this.username,
      payload.displayName ?? this.displayName,
      payload.avatarUrl !== undefined ? payload.avatarUrl : this.avatarUrl,
      payload.birthDate ?? this.birthDate,
      payload.bio !== undefined ? payload.bio : this.bio,
      payload.website !== undefined ? payload.website : this.website,
      payload.location !== undefined ? payload.location : this.location,
      this.createdAt,
    );
  }
}
