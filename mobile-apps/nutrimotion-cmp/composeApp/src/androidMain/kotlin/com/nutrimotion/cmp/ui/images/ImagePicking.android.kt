package com.nutrimotion.cmp.ui.images

import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.graphics.Canvas
import android.graphics.Color
import android.graphics.ImageDecoder
import android.graphics.Paint
import android.graphics.Rect
import android.os.Build
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.PickVisualMediaRequest
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.rememberUpdatedState
import androidx.compose.ui.platform.LocalContext
import java.io.ByteArrayOutputStream
import java.nio.ByteBuffer
import kotlin.math.max
import kotlin.math.roundToInt

private const val DECODE_MAX_EDGE = 3000

@Composable
actual fun rememberImagePicker(onPicked: (ByteArray?) -> Unit): () -> Unit {
    val context = LocalContext.current
    val currentOnPicked by rememberUpdatedState(onPicked)
    val launcher = rememberLauncherForActivityResult(ActivityResultContracts.PickVisualMedia()) { uri ->
        val bytes = uri?.let {
            runCatching { context.contentResolver.openInputStream(it)?.use { stream -> stream.readBytes() } }.getOrNull()
        }
        currentOnPicked(bytes)
    }
    return { launcher.launch(PickVisualMediaRequest(ActivityResultContracts.PickVisualMedia.ImageOnly)) }
}

/** Decodes with EXIF rotation applied, already capped near [DECODE_MAX_EDGE] to limit memory. */
private fun decode(bytes: ByteArray): Bitmap? = runCatching {
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
        ImageDecoder.decodeBitmap(ImageDecoder.createSource(ByteBuffer.wrap(bytes))) { decoder, info, _ ->
            decoder.allocator = ImageDecoder.ALLOCATOR_SOFTWARE
            val edge = max(info.size.width, info.size.height)
            if (edge > DECODE_MAX_EDGE) {
                val scale = DECODE_MAX_EDGE.toFloat() / edge
                decoder.setTargetSize(
                    (info.size.width * scale).roundToInt().coerceAtLeast(1),
                    (info.size.height * scale).roundToInt().coerceAtLeast(1),
                )
            }
        }
    } else {
        val bounds = BitmapFactory.Options().apply { inJustDecodeBounds = true }
        BitmapFactory.decodeByteArray(bytes, 0, bytes.size, bounds)
        var sample = 1
        while (max(bounds.outWidth, bounds.outHeight) / (sample * 2) >= DECODE_MAX_EDGE) sample *= 2
        BitmapFactory.decodeByteArray(bytes, 0, bytes.size, BitmapFactory.Options().apply { inSampleSize = sample })
    }
}.getOrNull()

/** Draws onto white (so transparent PNGs don't turn black) at the requested longest edge. */
private fun scaled(source: Bitmap, maxEdge: Int): Bitmap {
    val factor = minOf(1f, maxEdge.toFloat() / max(source.width, source.height))
    val width = (source.width * factor).roundToInt().coerceAtLeast(1)
    val height = (source.height * factor).roundToInt().coerceAtLeast(1)
    val out = Bitmap.createBitmap(width, height, Bitmap.Config.ARGB_8888)
    Canvas(out).apply {
        drawColor(Color.WHITE)
        drawBitmap(source, null, Rect(0, 0, width, height), Paint(Paint.FILTER_BITMAP_FLAG))
    }
    return out
}

actual fun reduceImageToJpeg(bytes: ByteArray, maxBytes: Int): ByteArray? {
    val source = decode(bytes) ?: return null
    try {
        var maxEdge = minOf(max(source.width, source.height), DECODE_MAX_EDGE)
        var quality = 90
        repeat(12) {
            val frame = scaled(source, maxEdge)
            val out = ByteArrayOutputStream()
            frame.compress(Bitmap.CompressFormat.JPEG, quality, out)
            frame.recycle()
            if (out.size() <= maxBytes) return out.toByteArray()
            if (quality > 72) quality -= 6 else maxEdge = (maxEdge * 0.8f).roundToInt()
        }
        return null
    } finally {
        source.recycle()
    }
}
