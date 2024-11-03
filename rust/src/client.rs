use std::env;

use crate::errors::ApiError;
use reqwest::{
    header::{HeaderMap, HeaderValue},
    Client as rClient,
};

/// Api client holds the HTTP client, the server end-point and the API Key to send with the request.
pub struct OnvoApiClient {
    /// Endpoint
    endpoint: String,

    /// HTTP / Reqwest client
    client: rClient,

    /// API Key
    api_key: String,
}

impl OnvoApiClient {
    /// Creates a new OnvoApiClient.
    /// If you don't provide an endpoint, the endpoint is taken from the environment variable `ONVO_API_ENDPOINT`.
    /// If you don't provide an API key, the API key is taken from the environment variable `ONVO_API_KEY`.
    pub fn new(endpoint: Option<&str>, api_key: Option<&str>) -> Self {
        let endpoint = endpoint
            .map(|e| e.to_string())
            .or_else(|| env::var("ONVO_API_ENDPOINT").ok())
            .expect(
                "You must provide an endpoint or set the ONVO_API_ENDPOINT environment variable.",
            );

        let api_key = api_key
            .map(|k| k.to_string())
            .or_else(|| env::var("ONVO_API_KEY").ok())
            .expect("You must provide an API key or set the ONVO_API_KEY environment variable.");

        Self {
            endpoint,
            api_key,
            client: rClient::new(),
        }
    }

    /// Sends a GET request to the API
    ///
    /// # Arguments
    ///
    /// * `path` - The path to the API endpoint
    ///
    /// # Returns
    ///
    /// * `Result<T, ApiError>` - The response body as a deserialized object
    ///
    /// # Errors
    ///
    /// * `ApiError` - If the response status code is not success
    pub async fn get<T: serde::de::DeserializeOwned>(&self, path: &str) -> Result<T, ApiError> {
        let url = format!("{}/{}", self.endpoint, path);

        let mut headers = HeaderMap::new();
        headers.insert("Content-Type", HeaderValue::from_static("application/json"));
        headers.insert("x-api-key", HeaderValue::from_str(&self.api_key).unwrap());

        let response = self.client.get(&url).headers(headers).send().await?;

        if !response.status().is_success() {
            let status = response.status();
            let text = response.text().await?;
            return Err(ApiError::from_status(status, text));
        }

        response.json::<T>().await.map_err(ApiError::from)
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use mockito::{mock, server_url};
    use reqwest::StatusCode;
    use tokio;

    #[tokio::test]
    async fn test_get_success() {
        const API_KEY: &str = "test_api_key";

        let _m = mock("GET", "/test")
            .match_header("x-api-key", API_KEY)
            .with_status(200)
            .with_header("content-type", "application/json")
            .with_body(r#"{"id": 1, "name": "Alice"}"#)
            .create();

        let api_client = OnvoApiClient::new(Some(&server_url()), Some(API_KEY));

        #[derive(Debug, serde::Deserialize)]
        struct TestResponse {
            id: u32,
            name: String,
        }

        let result: Result<TestResponse, ApiError> = api_client.get("test").await;
        assert!(result.is_ok());
        let response = result.unwrap();
        assert_eq!(response.id, 1);
        assert_eq!(response.name, "Alice");
    }

    #[tokio::test]
    async fn test_get_missing_api_key() {
        const API_KEY: &str = "test_api_key";

        let _m = mock("GET", "/test")
            .match_header("x-api-key", API_KEY) // Mismatch header expectation
            .with_status(200)
            .with_header("content-type", "application/json")
            .with_body(r#"{"id": 1, "name": "Alice"}"#)
            .create();

        let api_client = OnvoApiClient::new(Some(&server_url()), Some("wrong_key"));

        #[derive(Debug, serde::Deserialize)]
        struct TestResponse {
            id: u32,
            name: String,
        }

        let result: Result<TestResponse, ApiError> = api_client.get("test").await;

        assert!(result.is_err());
        if let Err(ApiError::Unexpected(status, _)) = result {
            assert_eq!(status, StatusCode::NOT_IMPLEMENTED);
        }
    }
}