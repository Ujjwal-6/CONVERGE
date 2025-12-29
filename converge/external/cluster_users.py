import numpy as np
import hdbscan
from sklearn.metrics.pairwise import cosine_similarity
from collections import defaultdict

# ---------------- CONFIG ----------------
MIN_CLUSTER_SIZE = 4        # tune based on dataset size
SOFT_MEMBERSHIP_THRESHOLD = 0.60
MAX_SOFT_CLUSTERS = 3

# ---------------- CLUSTERING ----------------
def cluster_users(user_records):
    """
    user_records: list of dicts with keys:
      - user_id
      - embedding (list[float])

    Returns:
      cluster_assignments (dict)
      cluster_centroids (dict)
    """

    user_ids = [u["user_id"] for u in user_records]
    embeddings = np.array([u["embedding"] for u in user_records])

    # Step 1: HDBSCAN (primary clusters)
    clusterer = hdbscan.HDBSCAN(
        min_cluster_size=MIN_CLUSTER_SIZE,
        metric="euclidean",
        prediction_data=True
    )

    labels = clusterer.fit_predict(embeddings)
    probabilities = clusterer.probabilities_

    # Step 2: Group by cluster
    clusters = defaultdict(list)

    for idx, label in enumerate(labels):
        if label != -1:  # -1 = noise
            clusters[label].append(idx)

    # Step 3: Compute cluster centroids
    cluster_centroids = {}

    for cluster_id, indices in clusters.items():
        cluster_centroids[cluster_id] = np.mean(
            embeddings[indices], axis=0
        )

    # Step 4: Soft membership via centroid similarity
    user_cluster_map = {}

    for idx, user_id in enumerate(user_ids):
        user_vec = embeddings[idx].reshape(1, -1)

        memberships = []

        for cluster_id, centroid in cluster_centroids.items():
            sim = cosine_similarity(user_vec, centroid.reshape(1, -1))[0][0]

            if sim >= SOFT_MEMBERSHIP_THRESHOLD:
                memberships.append({
                    "cluster_id": f"cluster_{cluster_id}",
                    "confidence": round(float(sim), 3)
                })

        # Sort & trim
        memberships.sort(key=lambda x: x["confidence"], reverse=True)
        memberships = memberships[:MAX_SOFT_CLUSTERS]

        user_cluster_map[user_id] = {
            "primary_cluster": (
                memberships[0]["cluster_id"]
                if memberships else "outlier"
            ),
            "memberships": memberships
        }

    return user_cluster_map, cluster_centroids
