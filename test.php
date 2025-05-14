<?php if (have_rows('lifestyle')): $i = 0; ?>
    <?php while (have_rows('lifestyle')) : the_row(); ?>

        <section class="lifestylePage" id="fashion">
            <div class="container">
                <div class="row align-items-center">
                    <div class="col-12 col-md-6 mt-4 mt-md-0 <?php if($i%2==0) echo 'order-2 order-md-2 pr-text'; else echo 'pt-text';?> " data-aos="fade-up"
                         data-aos-duration="1000">
                        <h5 class="subheading">lifestyle</h5>
                        <h2 class="heading"><?php the_sub_field('title'); ?></h2>
                        <p>
                            <?php the_sub_field('content'); ?>
                        </p>

                        <a href="/contact/" class="siteBtn blackOutline">Let's Talk</a>
                    </div>

                    <div class="col-12 col-md-6 mt-4 mt-md-0" data-aos="fade-up" data-aos-duration="1000">
                        <img src="<?php the_sub_field('image'); ?>" class="img-fluid" alt="">
                    </div>
                </div>
            </div>
        </section>
        <?php $i++; endwhile; ?>
<?php endif; ?>