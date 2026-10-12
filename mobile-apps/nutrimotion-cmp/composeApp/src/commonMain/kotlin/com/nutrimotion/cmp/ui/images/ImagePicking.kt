package com.nutrimotion.cmp.ui.images

import androidx.compose.runtime.Composable
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext

/** Returns a function that opens the system photo picker; [onPicked] gets the file bytes, or null if cancelled/unreadable. */
@Composable
expect fun rememberImagePicker(onPicked: (ByteArray?) -> Unit): () -> Unit

/** Re-encodes as JPEG, scaling down until it is at most [maxBytes]; null if the image can't be decoded. */
expect fun reduceImageToJpeg(bytes: ByteArray, maxBytes: Int): ByteArray?

class PreparedPhoto(
    val bytes: ByteArray,
    val contentType: String,
    val originalBytes: Int,
    val reduced: Boolean,
)

object MealPhotos {
    const val MAX_BYTES = 5 * 1024 * 1024

    private fun sniffType(bytes: ByteArray): String? {
        fun at(i: Int) = bytes.getOrNull(i)?.toInt()?.and(0xFF)
        return when {
            at(0) == 0xFF && at(1) == 0xD8 && at(2) == 0xFF -> "image/jpeg"
            at(0) == 0x89 && at(1) == 0x50 && at(2) == 0x4E && at(3) == 0x47 -> "image/png"
            bytes.size > 12 &&
                bytes.copyOfRange(0, 4).decodeToString() == "RIFF" &&
                bytes.copyOfRange(8, 12).decodeToString() == "WEBP" -> "image/webp"
            else -> null
        }
    }

    /** JPG/PNG/WebP up to 5 MB are kept as-is; anything larger (or another format, e.g. HEIC) is reduced to JPEG. */
    suspend fun prepare(bytes: ByteArray): PreparedPhoto? = withContext(Dispatchers.Default) {
        val type = sniffType(bytes)
        if (type != null && bytes.size <= MAX_BYTES) {
            PreparedPhoto(bytes, type, bytes.size, reduced = false)
        } else {
            reduceImageToJpeg(bytes, MAX_BYTES)?.let { PreparedPhoto(it, "image/jpeg", bytes.size, reduced = true) }
        }
    }

    fun formatSize(bytes: Int): String =
        if (bytes >= 1024 * 1024) {
            val tenths = (bytes * 10L / (1024 * 1024)).toInt()
            "${tenths / 10}.${tenths % 10} MB"
        } else {
            "${maxOf(1, bytes / 1024)} KB"
        }
}
