@file:OptIn(ExperimentalForeignApi::class)

package com.nutrimotion.cmp.ui.images

import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberUpdatedState
import kotlinx.cinterop.ExperimentalForeignApi
import kotlinx.cinterop.addressOf
import kotlinx.cinterop.useContents
import kotlinx.cinterop.usePinned
import platform.CoreGraphics.CGRectMake
import platform.CoreGraphics.CGSizeMake
import platform.Foundation.NSData
import platform.Foundation.create
import platform.PhotosUI.PHPickerConfiguration
import platform.PhotosUI.PHPickerFilter
import platform.PhotosUI.PHPickerResult
import platform.PhotosUI.PHPickerViewController
import platform.PhotosUI.PHPickerViewControllerDelegateProtocol
import platform.UIKit.UIApplication
import platform.UIKit.UIGraphicsImageRenderer
import platform.UIKit.UIGraphicsImageRendererFormat
import platform.UIKit.UIImage
import platform.UIKit.UIImageJPEGRepresentation
import platform.UIKit.UIViewController
import platform.darwin.NSObject
import platform.darwin.dispatch_async
import platform.darwin.dispatch_get_main_queue
import platform.posix.memcpy
import kotlin.math.max

private const val MAX_EDGE = 3000.0

private class PickerDelegate(var onPicked: (ByteArray?) -> Unit) : NSObject(), PHPickerViewControllerDelegateProtocol {
    override fun picker(picker: PHPickerViewController, didFinishPicking: List<*>) {
        picker.dismissViewControllerAnimated(true, null)
        val result = didFinishPicking.firstOrNull() as? PHPickerResult
        if (result == null) {
            onPicked(null)
            return
        }
        result.itemProvider.loadDataRepresentationForTypeIdentifier("public.image") { data, _ ->
            val bytes = data?.toByteArray()
            dispatch_async(dispatch_get_main_queue()) { onPicked(bytes) }
        }
    }
}

private fun topViewController(): UIViewController? {
    var top = UIApplication.sharedApplication.keyWindow?.rootViewController
    while (top?.presentedViewController != null) top = top.presentedViewController
    return top
}

@Composable
actual fun rememberImagePicker(onPicked: (ByteArray?) -> Unit): () -> Unit {
    val currentOnPicked by rememberUpdatedState(onPicked)
    val delegate = remember { PickerDelegate { bytes -> currentOnPicked(bytes) } }
    return {
        val configuration = PHPickerConfiguration()
        configuration.filter = PHPickerFilter.imagesFilter
        configuration.selectionLimit = 1
        val picker = PHPickerViewController(configuration = configuration)
        picker.delegate = delegate
        topViewController()?.presentViewController(picker, animated = true, completion = null)
    }
}

private fun ByteArray.toNSData(): NSData = usePinned { pinned ->
    NSData.create(bytes = pinned.addressOf(0), length = size.toULong())
}

private fun NSData.toByteArray(): ByteArray {
    val size = length.toInt()
    val out = ByteArray(size)
    if (size > 0) out.usePinned { pinned -> memcpy(pinned.addressOf(0), bytes, length) }
    return out
}

private fun scaled(image: UIImage, maxEdge: Double): UIImage {
    val (width, height) = image.size.useContents { width to height }
    val factor = minOf(1.0, maxEdge / max(width, height))
    val targetWidth = maxOf(1.0, width * factor)
    val targetHeight = maxOf(1.0, height * factor)
    val format = UIGraphicsImageRendererFormat()
    format.scale = 1.0
    format.opaque = true
    val renderer = UIGraphicsImageRenderer(size = CGSizeMake(targetWidth, targetHeight), format = format)
    return renderer.imageWithActions { _ ->
        image.drawInRect(CGRectMake(0.0, 0.0, targetWidth, targetHeight))
    }
}

actual fun reduceImageToJpeg(bytes: ByteArray, maxBytes: Int): ByteArray? {
    if (bytes.isEmpty()) return null
    val image = UIImage.imageWithData(bytes.toNSData()) ?: return null
    var maxEdge = minOf(image.size.useContents { max(width, height) }, MAX_EDGE)
    var quality = 0.9
    repeat(12) {
        val jpeg = UIImageJPEGRepresentation(scaled(image, maxEdge), quality) ?: return null
        if (jpeg.length.toInt() <= maxBytes) return jpeg.toByteArray()
        if (quality > 0.72) quality -= 0.06 else maxEdge *= 0.8
    }
    return null
}
