export interface RecommendedBook {
  title: string;
  author: string;
  whyYouWillLoveIt: string;
  platforms: string[];
}

export interface RecommendedSeries {
  title: string;
  whyYouWillLoveIt: string;
  platforms: string[];
}

export interface RecommendedMovie {
  title: string;
  whyYouWillLoveIt: string;
  platforms: string[];
}

export interface RecommendationResults {
  books: RecommendedBook[];
  series: RecommendedSeries[];
  movie: RecommendedMovie;
}

export interface RecommendationBatch {
  id?: string;
  userId: string;
  createdAt: string;
  inputs: {
    booksRead: string[];
    showsWatched: string[];
    genre: string;
    tropes: string[];
    specificDetails: string;
  };
  results: RecommendationResults;
}

export interface VibeUser {
  uid: string;
  email: string;
  displayName: string | null;
  photoURL: string | null;
  isMock?: boolean;
}
