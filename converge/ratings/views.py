from rest_framework import status
from rest_framework.decorators import api_view
from rest_framework.response import Response
from .serializers import SubmitRatingSerializer, RatingSerializer
from .services import submit_rating_record, get_global_rating_data


@api_view(['POST'])
def submit_rating(request):
	"""Submit a peer rating after project completion."""
	serializer = SubmitRatingSerializer(data=request.data)
	if not serializer.is_valid():
		return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
	data = serializer.validated_data
	record = submit_rating_record(
		rater_id=data['rater_id'],
		ratee_id=data['ratee_id'],
		project_id=data['project_id'],
		category_scores=data['category_scores']
	)
	return Response(RatingSerializer(record).data, status=status.HTTP_201_CREATED)


@api_view(['GET'])
def user_rating(request, ratee_id):
	"""Get global rating for a user (Bayesian smoothed)."""
	data = get_global_rating_data(ratee_id)
	return Response(data, status=status.HTTP_200_OK)
