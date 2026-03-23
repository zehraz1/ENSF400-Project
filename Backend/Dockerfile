FROM python:3.9-slim
#Set the working Directory
WORKDIR /endpoint
# Copy the current directory contents into the container
COPY . .
#Install the requirements
RUN pip install flask yfinance google-genai flask_cors
# ENV FLASK_APP=Endpoint.py
#Make port 5000 available to the world outside this container
EXPOSE 5001 
# if you use a different port, e.g., 8000, change the line above to EXPOSE 8000
#Define the command to run the application
CMD ["python3", "Endpoint.py"]
