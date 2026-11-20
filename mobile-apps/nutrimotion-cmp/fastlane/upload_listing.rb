# Uploads the default Play store listing without requiring an app release.
# Fastlane supply refuses to update listings until a version code exists on a track.

require "googleauth"
require "json"
require "net/http"
require "uri"

PACKAGE = "com.nutrimotion.cmp"
LANGUAGE = "en-US"
API = "https://androidpublisher.googleapis.com/androidpublisher/v3/applications/#{PACKAGE}"
UPLOAD = "https://androidpublisher.googleapis.com/upload/androidpublisher/v3/applications/#{PACKAGE}"

metadata = File.expand_path("metadata/android/#{LANGUAGE}", __dir__)

def api(method, url, token, body: nil, content_type: "application/json")
  uri = URI(url)
  http = Net::HTTP.new(uri.host, uri.port)
  http.use_ssl = true
  request = Net::HTTP.const_get(method.capitalize).new(uri)
  request["Authorization"] = "Bearer #{token}"
  if body
    request["Content-Type"] = content_type
    request.body = body
  end
  response = http.request(request)
  return JSON.parse(response.body) if response.is_a?(Net::HTTPSuccess) && !response.body.to_s.empty?
  return {} if response.is_a?(Net::HTTPSuccess) || (method == "delete" && response.code == "404")

  warn("#{method.upcase} #{uri.path} failed #{response.code}: #{response.body}")
  exit 1
end

creds = Google::Auth::ServiceAccountCredentials.make_creds(
  json_key_io: File.open(ENV.fetch("PLAY_STORE_JSON_KEY_PATH")),
  scope: "https://www.googleapis.com/auth/androidpublisher"
)
token = creds.fetch_access_token!["access_token"]

edit_id = api("post", "#{API}/edits", token, body: "{}").fetch("id")
puts "Edit #{edit_id}"

listing = {
  language: LANGUAGE,
  title: File.read(File.join(metadata, "title.txt"), encoding: "UTF-8").strip,
  shortDescription: File.read(File.join(metadata, "short_description.txt"), encoding: "UTF-8").strip,
  fullDescription: File.read(File.join(metadata, "full_description.txt"), encoding: "UTF-8").strip
}
api("put", "#{API}/edits/#{edit_id}/listings/#{LANGUAGE}", token, body: JSON.generate(listing))
puts "Saved #{listing[:title]} (#{listing[:shortDescription].length} character short description)"

images = File.join(metadata, "images")
{
  "icon" => [File.join(images, "icon.png")],
  "featureGraphic" => [File.join(images, "featureGraphic.png")],
  "phoneScreenshots" => Dir[File.join(images, "phoneScreenshots", "*.png")].sort
}.each do |type, paths|
  api("delete", "#{API}/edits/#{edit_id}/listings/#{LANGUAGE}/#{type}", token)
  paths.each do |path|
    api(
      "post",
      "#{UPLOAD}/edits/#{edit_id}/listings/#{LANGUAGE}/#{type}?uploadType=media",
      token,
      body: File.binread(path),
      content_type: "image/png"
    )
    puts "Uploaded #{type}: #{File.basename(path)}"
  end
end

api("post", "#{API}/edits/#{edit_id}:commit", token, body: "{}")
puts "Default store listing committed."
